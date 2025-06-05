import os
from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_bcrypt import Bcrypt
from dotenv import load_dotenv
import jwt
from datetime import datetime, timedelta, timezone # Added timezone
import datetime # ensure datetime is available for type hints if any
from functools import wraps
import pandas as pd
from werkzeug.utils import secure_filename

load_dotenv()

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL', 'postgresql://user:password@localhost/phonescanada_auction')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'default_secret_key')
app.config['JWT_SECRET_KEY'] = os.environ.get('JWT_SECRET_KEY', 'default_jwt_secret_key')


db = SQLAlchemy(app)
migrate = Migrate(app, db)
bcrypt = Bcrypt(app)

# Import models here to avoid circular imports
from models import User, Carrier, Auction, Lot, Bid, AuctionWinner # Assuming models.py is in the same directory

# --- Decorator for JWT Required ---
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        if 'x-access-token' in request.headers:
            token = request.headers['x-access-token']
        if not token:
            return jsonify({'message': 'Token is missing!'}), 401
        try:
            data = jwt.decode(token, app.config['JWT_SECRET_KEY'], algorithms=['HS256'])
            current_user = User.query.filter_by(user_id=data['user_id']).first()
            if not current_user:
                return jsonify({'message': 'Token is invalid!'}), 401
        except jwt.ExpiredSignatureError:
            return jsonify({'message': 'Token has expired!'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'message': 'Token is invalid!'}), 401
        return f(current_user, *args, **kwargs)
    return decorated

# --- Admin Role Required Decorator ---
def admin_required(f):
    @wraps(f)
    @token_required # Ensures token_required is also applied
    def decorated(current_user, *args, **kwargs):
        if current_user.role != 'admin':
            return jsonify({'message': 'Admin role required!'}), 403
        return f(current_user, *args, **kwargs)
    return decorated

@app.route('/')
def hello_world():
    return 'Hello from Backend! User management is being set up.'

# --- Admin Login Endpoint ---
@app.route('/admin/login', methods=['POST'])
def admin_login():
    data = request.get_json()
    if not data or not data.get('email') or not data.get('password'):
        return jsonify({'message': 'Email and password required'}), 400
    user = User.query.filter_by(email=data['email']).first()
    if user and user.role == 'admin' and user.check_password(data['password']):
        token = jwt.encode({
            'user_id': user.user_id,
            'role': user.role,
            'exp': datetime.datetime.now(timezone.utc) + timedelta(hours=24) # Use timezone.utc
        }, app.config['JWT_SECRET_KEY'], algorithm='HS256')
        # Update last_login
        user.last_login = datetime.datetime.now(timezone.utc)
        db.session.commit()
        return jsonify({'message': 'Admin login successful', 'token': token})
    return jsonify({'message': 'Invalid credentials or not an admin'}), 401

# --- Admin User Management Endpoints ---
@app.route('/admin/users', methods=['POST'])
@admin_required
def create_user_by_admin(current_admin):
    data = request.get_json()
    if not data or not data.get('email') or not data.get('password'):
        return jsonify({'message': 'Email and password are required for new user'}), 400
    if User.query.filter_by(email=data['email']).first():
        return jsonify({'message': 'User with this email already exists'}), 409
    new_user = User(
        email=data['email'],
        company_name=data.get('company_name'),
        role=data.get('role', 'client'),  # Default to client, admin can specify
        deposit_status=data.get('deposit_status', 'pending'),
        is_active=data.get('is_active', True)
    )
    new_user.set_password(data['password'])
    db.session.add(new_user)
    db.session.commit()
    return jsonify({'message': 'User created successfully', 'user_id': new_user.user_id}), 201

@app.route('/admin/users', methods=['GET'])
@admin_required
def get_all_users_by_admin(current_admin):
    users = User.query.all()
    output = []
    for user_obj in users: # Renamed user to user_obj to avoid conflict with User class
        user_data = {
            'user_id': user_obj.user_id,
            'email': user_obj.email,
            'company_name': user_obj.company_name,
            'role': user_obj.role,
            'deposit_status': user_obj.deposit_status,
            'is_active': user_obj.is_active,
            'created_at': user_obj.created_at.isoformat() if user_obj.created_at else None,
            'last_login': user_obj.last_login.isoformat() if user_obj.last_login else None
        }
        output.append(user_data)
    return jsonify({'users': output})

@app.route('/admin/users/<int:user_id>', methods=['GET'])
@admin_required
def get_user_by_admin(current_admin, user_id):
    user = User.query.get_or_404(user_id)
    user_data = {
        'user_id': user.user_id,
        'email': user.email,
        'company_name': user.company_name,
        'role': user.role,
        'deposit_status': user.deposit_status,
        'is_active': user.is_active,
        'created_at': user.created_at.isoformat() if user.created_at else None,
        'last_login': user.last_login.isoformat() if user.last_login else None
    }
    return jsonify(user_data)

@app.route('/admin/users/<int:user_id>', methods=['PUT'])
@admin_required
def update_user_by_admin(current_admin, user_id):
    user = User.query.get_or_404(user_id)
    data = request.get_json()
    if 'email' in data and data['email'] != user.email:
        if User.query.filter_by(email=data['email']).first():
            return jsonify({'message': 'User with this email already exists'}), 409
        user.email = data['email']
    if 'password' in data and data['password']: # Allow changing password
        user.set_password(data['password'])
    user.company_name = data.get('company_name', user.company_name)
    user.role = data.get('role', user.role)
    user.deposit_status = data.get('deposit_status', user.deposit_status)
    user.is_active = data.get('is_active', user.is_active)
    db.session.commit()
    return jsonify({'message': 'User updated successfully'})

@app.route('/admin/users/<int:user_id>', methods=['DELETE'])
@admin_required
def delete_user_by_admin(current_admin, user_id):
    user = User.query.get_or_404(user_id)
    if user.email == 'admin@phonescanada.com': # Prevent deleting the default admin
        return jsonify({'message': 'Cannot delete the primary admin account'}), 403
    db.session.delete(user)
    db.session.commit()
    return jsonify({'message': 'User deleted successfully'})

# Helper to parse datetimes from strings if needed
def parse_datetime_string(dt_str):
    if not dt_str:
        return None
    try:
        # Attempt to parse ISO format with timezone
        return datetime.datetime.fromisoformat(dt_str)
    except ValueError:
        try:
            # Attempt to parse without milliseconds
            return datetime.datetime.strptime(dt_str, "%Y-%m-%dT%H:%M:%S%z")
        except ValueError:
            try:
                # Attempt to parse if it is naive and then make it aware (assuming UTC)
                dt_naive = datetime.datetime.strptime(dt_str, "%Y-%m-%dT%H:%M:%S")
                return dt_naive.replace(tzinfo=datetime.timezone.utc)
            except ValueError:
                return None # Or raise error

# --- Carrier Management Endpoints ---
@app.route("/admin/carriers", methods=["POST"])
@admin_required
def create_carrier(current_admin):
    data = request.get_json()
    if not data or not data.get("name"):
        return jsonify({"message": "Carrier name is required"}), 400
    if Carrier.query.filter_by(name=data["name"]).first():
        return jsonify({"message": "Carrier with this name already exists"}), 409

    new_carrier = Carrier(name=data["name"])
    db.session.add(new_carrier)
    db.session.commit()
    return jsonify({"message": "Carrier created successfully", "carrier_id": new_carrier.carrier_id}), 201

@app.route("/admin/carriers", methods=["GET"])
@admin_required
def get_all_carriers(current_admin):
    carriers = Carrier.query.all()
    output = []
    for carrier_obj in carriers: # Renamed carrier to carrier_obj
        output.append({
            "carrier_id": carrier_obj.carrier_id,
            "name": carrier_obj.name,
            "created_at": carrier_obj.created_at.isoformat() if carrier_obj.created_at else None
        })
    return jsonify({"carriers": output})

# --- Auction Management Endpoints ---
@app.route("/admin/auctions", methods=["POST"])
@admin_required
def create_auction(current_admin):
    data = request.get_json()
    required_fields = ["name", "carrier_id", "end_time"]
    for field in required_fields:
        if field not in data or not data[field]:
            return jsonify({"message": f"{field} is required"}), 400

    carrier = Carrier.query.get(data["carrier_id"])
    if not carrier:
        return jsonify({"message": "Carrier not found"}), 404

    end_time_obj = parse_datetime_string(data["end_time"])
    if not end_time_obj:
        return jsonify({"message": "Invalid end_time format. Use ISO format like YYYY-MM-DDTHH:MM:SSZ or YYYY-MM-DDTHH:MM:SS+00:00"}), 400

    start_time_obj = parse_datetime_string(data.get("start_time")) if data.get("start_time") else datetime.datetime.now(datetime.timezone.utc)

    new_auction = Auction(
        name=data["name"],
        carrier_id=data["carrier_id"],
        start_time=start_time_obj,
        end_time=end_time_obj,
        status=data.get("status", "scheduled"),
        grading_guide=data.get("grading_guide"),
        is_visible=data.get("is_visible", False),
        created_by_user_id=current_admin.user_id
    )
    db.session.add(new_auction)
    db.session.commit()
    return jsonify({"message": "Auction created successfully", "auction_id": new_auction.auction_id}), 201

@app.route("/admin/auctions", methods=["GET"])
@admin_required
def get_all_auctions(current_admin):
    auctions = Auction.query.order_by(Auction.created_at.desc()).all()
    output = []
    for auction_obj in auctions: # Renamed auction to auction_obj
        output.append({
            "auction_id": auction_obj.auction_id,
            "name": auction_obj.name,
            "carrier_id": auction_obj.carrier_id,
            "carrier_name": auction_obj.carrier.name if auction_obj.carrier else None,
            "start_time": auction_obj.start_time.isoformat() if auction_obj.start_time else None,
            "end_time": auction_obj.end_time.isoformat() if auction_obj.end_time else None,
            "status": auction_obj.status,
            "is_visible": auction_obj.is_visible,
            "grading_guide": auction_obj.grading_guide,
            "created_at": auction_obj.created_at.isoformat() if auction_obj.created_at else None,
            "lot_count": len(auction_obj.lots)
        })
    return jsonify({"auctions": output})

@app.route("/admin/auctions/<int:auction_id>", methods=["GET"])
@admin_required
def get_auction_details(current_admin, auction_id):
    auction = Auction.query.get_or_404(auction_id)
    lots_data = []
    for lot_obj in auction.lots: # Renamed lot to lot_obj
        lots_data.append({
            "lot_id": lot_obj.lot_id,
            "lot_identifier": lot_obj.lot_identifier,
            "device_name": lot_obj.device_name,
            "device_details": lot_obj.device_details,
            "condition": lot_obj.condition,
            "quantity": lot_obj.quantity,
            "min_bid": float(lot_obj.min_bid) if lot_obj.min_bid is not None else None,
            "image_url": lot_obj.image_url
        })
    auction_data = {
        "auction_id": auction.auction_id,
        "name": auction.name,
        "carrier_id": auction.carrier_id,
        "carrier_name": auction.carrier.name if auction.carrier else None,
        "start_time": auction.start_time.isoformat() if auction.start_time else None,
        "end_time": auction.end_time.isoformat() if auction.end_time else None,
        "status": auction.status,
        "is_visible": auction.is_visible,
        "grading_guide": auction.grading_guide,
        "lots": lots_data,
        "created_at": auction.created_at.isoformat() if auction.created_at else None,
        "updated_at": auction.updated_at.isoformat() if auction.updated_at else None,
    }
    return jsonify(auction_data)

@app.route("/admin/auctions/<int:auction_id>", methods=["PUT"])
@admin_required
def update_auction(current_admin, auction_id):
    auction = Auction.query.get_or_404(auction_id)
    data = request.get_json()

    auction.name = data.get("name", auction.name)
    if "carrier_id" in data:
        carrier = Carrier.query.get(data["carrier_id"])
        if not carrier:
            return jsonify({"message": "Carrier not found"}), 404
        auction.carrier_id = data["carrier_id"]
    if "start_time" in data:
        st = parse_datetime_string(data["start_time"])
        if not st: return jsonify({"message": "Invalid start_time format"}),400
        auction.start_time = st
    if "end_time" in data:
        et = parse_datetime_string(data["end_time"])
        if not et: return jsonify({"message": "Invalid end_time format"}),400
        auction.end_time = et

    auction.status = data.get("status", auction.status)
    auction.grading_guide = data.get("grading_guide", auction.grading_guide)
    auction.is_visible = data.get("is_visible", auction.is_visible)

    auction.updated_at = datetime.datetime.now(datetime.timezone.utc)
    db.session.commit()
    return jsonify({"message": "Auction updated successfully"})

@app.route("/admin/auctions/<int:auction_id>", methods=["DELETE"])
@admin_required
def delete_auction(current_admin, auction_id):
    auction = Auction.query.get_or_404(auction_id)
    db.session.delete(auction)
    db.session.commit()
    return jsonify({"message": "Auction deleted successfully"})

# --- Lot Upload Endpoint ---
UPLOAD_FOLDER = "uploads"
ALLOWED_EXTENSIONS = {"csv", "xlsx"}

if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER

def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route("/admin/auctions/<int:auction_id>/upload_lots", methods=["POST"])
@admin_required
def upload_lots_file(current_admin, auction_id):
    auction = Auction.query.get_or_404(auction_id)
    if "file" not in request.files:
        return jsonify({"message": "No file part"}), 400
    file = request.files["file"]
    if file.filename == "":
        return jsonify({"message": "No selected file"}), 400
    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        filepath = os.path.join(app.config["UPLOAD_FOLDER"], filename)
        file.save(filepath)

        try:
            if filename.endswith(".csv"):
                df = pd.read_csv(filepath)
            elif filename.endswith(".xlsx"):
                df = pd.read_excel(filepath)
            else:
                return jsonify({"message": "Unsupported file type"}), 400

            expected_cols = {
                "lot_identifier": ["lot id", "lot_id", "identifier", "lot_identifier"],
                "device_name": ["device name", "device_name", "item name"],
                "device_details": ["details", "description", "device_details"],
                "image_url": ["image url", "image_url", "image"],
                "condition": ["condition", "grade"],
                "quantity": ["quantity", "qty"],
                "min_bid": ["minimum bid", "min_bid", "start price"]
            }

            df.columns = [str(col).lower() for col in df.columns]

            mapped_cols = {}
            for target_col, potential_names in expected_cols.items():
                for potential_name in potential_names:
                    if potential_name in df.columns:
                        mapped_cols[target_col] = potential_name
                        break

            required_mapped_cols = ["lot_identifier", "device_name"]
            for rmc in required_mapped_cols:
                if rmc not in mapped_cols:
                    missing_pot_names = expected_cols.get(rmc, ["unknown column"])
                    return jsonify({"message": f"Missing required column in file: one of {missing_pot_names}"}), 400

            lots_added = 0
            errors = []
            for index, row in df.iterrows():
                try:
                    lot_id_val = row.get(mapped_cols.get("lot_identifier"))
                    if pd.isna(lot_id_val) or str(lot_id_val).strip() == "":
                        errors.append(f"Row {index+2}: lot_identifier is missing or empty.")
                        continue

                    existing_lot = Lot.query.filter_by(auction_id=auction.auction_id, lot_identifier=str(lot_id_val)).first()
                    if existing_lot:
                        errors.append(f"Row {index+2}: Lot with identifier {lot_id_val} already exists in this auction.")
                        continue

                    new_lot = Lot(
                        auction_id=auction.auction_id,
                        lot_identifier=str(lot_id_val),
                        device_name=str(row.get(mapped_cols.get("device_name"))),
                        device_details=str(row.get(mapped_cols.get("device_details"), "")) if mapped_cols.get("device_details") in row else None,
                        image_url=str(row.get(mapped_cols.get("image_url"), "")) if mapped_cols.get("image_url") in row else None,
                        condition=str(row.get(mapped_cols.get("condition"), "")) if mapped_cols.get("condition") in row else None,
                        quantity=int(row.get(mapped_cols.get("quantity"), 1)) if mapped_cols.get("quantity") in row and pd.notna(row.get(mapped_cols.get("quantity"))) else 1,
                        min_bid=float(row.get(mapped_cols.get("min_bid"), 0.00)) if mapped_cols.get("min_bid") in row and pd.notna(row.get(mapped_cols.get("min_bid"))) else 0.00
                    )
                    db.session.add(new_lot)
                    lots_added += 1
                except Exception as e:
                    errors.append(f"Row {index+2}: Error processing row - {str(e)}")

            if errors:
                db.session.rollback()
                if os.path.exists(filepath):
                    os.remove(filepath)
                return jsonify({"message": "Errors occurred while processing the file. No lots were added.", "errors": errors}), 400

            db.session.commit()
            if os.path.exists(filepath):
                os.remove(filepath)
            return jsonify({"message": f"Successfully added {lots_added} lots to auction {auction.auction_id}", "errors": errors}), 201

        except Exception as e:
            db.session.rollback()
            if os.path.exists(filepath):
                os.remove(filepath)
            return jsonify({"message": f"Error processing file: {str(e)}"}), 500

    else:
        return jsonify({"message": "File type not allowed"}), 400

# --- Client Role Required Decorator ---
def client_required(f):
    @wraps(f)
    @token_required # Leverages the existing token_required to decode token and get user
    def decorated(current_user, *args, **kwargs):
        if current_user.role != "client":
            return jsonify({"message": "Client role required!"}), 403
        return f(current_user, *args, **kwargs)
    return decorated

# --- Client Login Endpoint ---
@app.route("/login", methods=["POST"]) # General login, could be for clients
def client_login():
    data = request.get_json()
    if not data or not data.get("email") or not data.get("password"):
        return jsonify({"message": "Email and password required"}), 400

    user = User.query.filter_by(email=data["email"]).first()

    if user and user.role == "client" and user.check_password(data["password"]):
        if not user.is_active:
            return jsonify({"message": "Client account is inactive. Please contact support."}), 403

        token = jwt.encode({
            "user_id": user.user_id,
            "role": user.role,
            "email": user.email,
            "company_name": user.company_name,
            "deposit_status": user.deposit_status,
            "exp": datetime.datetime.now(timezone.utc) + timedelta(hours=24)
        }, app.config["JWT_SECRET_KEY"], algorithm="HS256")

        user.last_login = datetime.datetime.now(timezone.utc)
        db.session.commit()

        return jsonify({
            "message": "Client login successful",
            "token": token,
            "user": {
                "email": user.email,
                "company_name": user.company_name,
                "role": user.role,
                "deposit_status": user.deposit_status
            }
        })

    return jsonify({"message": "Invalid credentials or not a client account"}), 401

# --- Client Profile Endpoint ---
@app.route("/profile", methods=["GET"])
@client_required # Protect with client_required decorator
def client_profile(current_client): # current_client is passed by the decorator
    if not current_client.is_active:
         return jsonify({"message": "Client account is inactive."}), 403

    return jsonify({
        "user_id": current_client.user_id,
        "email": current_client.email,
        "company_name": current_client.company_name,
        "role": current_client.role,
        "deposit_status": current_client.deposit_status,
        "is_active": current_client.is_active,
        "created_at": current_client.created_at.isoformat() if current_client.created_at else None,
        "last_login": current_client.last_login.isoformat() if current_client.last_login else None
    }), 200

# --- Bid Submission Endpoint ---
@app.route("/auctions/<int:auction_id>/lots/<int:lot_id>/bid", methods=["POST"])
@client_required # Only authenticated clients can bid
def submit_bid(current_client, auction_id, lot_id):
    data = request.get_json()
    bid_amount_str = data.get("bid_amount")

    if not bid_amount_str:
        return jsonify({"message": "Bid amount is required"}), 400

    try:
        bid_amount = float(bid_amount_str)
        if bid_amount <= 0:
            raise ValueError("Bid amount must be positive")
    except ValueError as e:
        return jsonify({"message": f"Invalid bid amount: {str(e)}"}), 400

    if not current_client.is_active:
        return jsonify({"message": "Your account is inactive. Cannot place bids."}), 403

    if current_client.deposit_status not in ["on_file", "cleared"]:
        return jsonify({"message": "Bidding restricted. Your deposit is not on file or cleared. Please contact support."}), 403

    lot = Lot.query.get_or_404(lot_id)
    auction = Auction.query.get_or_404(auction_id)

    if lot.auction_id != auction.auction_id:
        return jsonify({"message": "Lot does not belong to the specified auction."}), 400

    if auction.status != "active":
        return jsonify({"message": f"Auction is not active. Current status: {auction.status}"}), 403
    if not auction.is_visible:
        return jsonify({"message": "Auction is not visible."}), 403
    if datetime.datetime.now(timezone.utc) >= auction.end_time:
        return jsonify({"message": "Auction has already ended."}), 403

    if lot.min_bid is not None and bid_amount < lot.min_bid:
        return jsonify({"message": f"Your bid must be at least ${lot.min_bid:.2f}"}), 400

    existing_bid = Bid.query.filter_by(lot_id=lot.lot_id, user_id=current_client.user_id).first()

    if existing_bid:
        existing_bid.bid_amount = bid_amount
        existing_bid.bid_time = datetime.datetime.now(timezone.utc)
        existing_bid.status = "active"
        db.session.add(existing_bid)
        bid_action_message = "Your bid has been updated."
    else:
        new_bid = Bid(
            lot_id=lot.lot_id,
            user_id=current_client.user_id,
            bid_amount=bid_amount,
            bid_time=datetime.datetime.now(timezone.utc),
            status="active"
        )
        db.session.add(new_bid)
        bid_action_message = "Bid submitted successfully."

    try:
        db.session.commit()
        return jsonify({"message": bid_action_message, "lot_id": lot.lot_id, "bid_amount": bid_amount}), 201
    except Exception as e:
        db.session.rollback()
        app.logger.error(f"Error committing bid: {str(e)}")
        return jsonify({"message": "Could not submit bid due to a server error."}), 500

# --- List Client's Bids Endpoint ---
@app.route("/my-bids", methods=["GET"])
@client_required
def get_my_bids(current_client):
    bids = Bid.query.filter_by(user_id=current_client.user_id).order_by(Bid.bid_time.desc()).all()

    output = []
    for bid in bids:
        lot_info = {
            "lot_id": bid.lot.lot_id,
            "lot_identifier": bid.lot.lot_identifier,
            "device_name": bid.lot.device_name,
            "auction_name": bid.lot.auction.name,
            "auction_id": bid.lot.auction_id,
            "auction_end_time": bid.lot.auction.end_time.isoformat() if bid.lot.auction.end_time else None,
            "auction_status": bid.lot.auction.status
        }
        output.append({
            "bid_id": bid.bid_id,
            "lot_info": lot_info,
            "bid_amount": float(bid.bid_amount),
            "bid_time": bid.bid_time.isoformat() if bid.bid_time else None,
            "status": bid.status
        })

    return jsonify({"bids": output}), 200

# --- Auction Status Processing Endpoint (Admin) ---
@app.route("/admin/auctions/process-statuses", methods=["POST"])
@admin_required
def process_auction_statuses(current_admin):
    now = datetime.datetime.now(timezone.utc)
    updated_count = 0

    # Process scheduled auctions to active
    scheduled_auctions = Auction.query.filter_by(status="scheduled").all()
    for auction in scheduled_auctions:
        if auction.start_time <= now and auction.end_time > now:
            auction.status = "active"
            db.session.add(auction)
            updated_count += 1

    # Process active auctions to closed
    active_auctions = Auction.query.filter_by(status="active").all()
    for auction in active_auctions:
        if auction.end_time <= now:
            auction.status = "closed"
            db.session.add(auction)
            updated_count += 1

    db.session.commit()
    return jsonify({"message": f"Processed auction statuses. {updated_count} auctions updated."}), 200

# --- Winner Determination Endpoint (Admin) ---
@app.route("/admin/auctions/<int:auction_id>/determine-winners", methods=["POST"])
@admin_required
def determine_winners_endpoint(current_admin, auction_id):
    auction = Auction.query.get_or_404(auction_id)

    if auction.status != "closed":
        return jsonify({"message": "Winners can only be determined for closed auctions."}), 400

    lots_processed = 0
    winners_determined = 0

    for lot in auction.lots:
        lots_processed += 1

        winning_bid = Bid.query.filter_by(lot_id=lot.lot_id)\
            .join(User, User.user_id == Bid.user_id)\
            .filter(User.is_active == True)\
            .order_by(Bid.bid_amount.desc(), Bid.bid_time.asc())\
            .first()

        if winning_bid:
            AuctionWinner.query.filter_by(lot_id=lot.lot_id).delete()
            db.session.flush()

            new_winner = AuctionWinner(
                lot_id=lot.lot_id,
                user_id=winning_bid.user_id,
                winning_bid_id=winning_bid.bid_id,
                winning_amount=winning_bid.bid_amount,
                awarded_at=datetime.datetime.now(timezone.utc)
            )
            db.session.add(new_winner)
            winners_determined += 1

            all_bids_for_lot = Bid.query.filter_by(lot_id=lot.lot_id).all()
            for b in all_bids_for_lot:
                if b.bid_id == winning_bid.bid_id:
                    b.status = "winning"
                else:
                    b.status = "outbid"
                db.session.add(b)
        else:
            all_bids_for_lot = Bid.query.filter_by(lot_id=lot.lot_id).all()
            for b in all_bids_for_lot:
                b.status = "lost"
                db.session.add(b)

    db.session.commit()
    return jsonify({
        "message": f"Winner determination complete for auction {auction.name}.",
        "lots_processed": lots_processed,
        "winners_determined": winners_determined
    }), 200

# --- Client-Facing Auction Endpoints ---
@app.route("/auctions", methods=["GET"])
@token_required
def get_active_auctions_for_clients(current_user):
    carrier_filter = request.args.get("carrier_id")
    query = Auction.query.filter_by(status="active", is_visible=True)

    if carrier_filter:
        try:
            carrier_id_int = int(carrier_filter)
            query = query.filter_by(carrier_id=carrier_id_int)
        except ValueError:
            return jsonify({"message": "Invalid carrier_id format."}), 400

    auctions = query.order_by(Auction.end_time.asc()).all()

    output = []
    auctions_by_carrier = {}

    for auction in auctions:
        auction_data = {
            "auction_id": auction.auction_id,
            "name": auction.name,
            "carrier_id": auction.carrier_id,
            "carrier_name": auction.carrier.name if auction.carrier else "Unknown Carrier",
            "start_time": auction.start_time.isoformat() if auction.start_time else None,
            "end_time": auction.end_time.isoformat() if auction.end_time else None,
            "grading_guide": auction.grading_guide,
            "lot_count": len(auction.lots)
        }
        if auction.carrier.name not in auctions_by_carrier:
            auctions_by_carrier[auction.carrier.name] = {
                "carrier_id": auction.carrier_id,
                "carrier_name": auction.carrier.name,
                "auctions": []
            }
        auctions_by_carrier[auction.carrier.name]["auctions"].append(auction_data)

    for auction in auctions:
         output.append({
            "auction_id": auction.auction_id,
            "name": auction.name,
            "carrier_id": auction.carrier_id,
            "carrier_name": auction.carrier.name if auction.carrier else "Unknown Carrier",
            "start_time": auction.start_time.isoformat() if auction.start_time else None,
            "end_time": auction.end_time.isoformat() if auction.end_time else None,
            "grading_guide": auction.grading_guide,
            "lot_count": len(auction.lots)
        })

    return jsonify({"auctions_list": output, "auctions_by_carrier": auctions_by_carrier }), 200

@app.route("/auctions/<int:auction_id>", methods=["GET"])
@token_required
def get_auction_details_for_clients(current_user, auction_id):
    auction = Auction.query.filter_by(auction_id=auction_id, status="active", is_visible=True).first_or_404()

    lots_data = []
    for lot in auction.lots:
        lots_data.append({
            "lot_id": lot.lot_id,
            "lot_identifier": lot.lot_identifier,
            "device_name": lot.device_name,
            "device_details": lot.device_details,
            "image_url": lot.image_url,
            "condition": lot.condition,
            "quantity": lot.quantity,
            "min_bid": float(lot.min_bid) if lot.min_bid is not None else None
        })

    auction_data = {
        "auction_id": auction.auction_id,
        "name": auction.name,
        "carrier_name": auction.carrier.name if auction.carrier else "Unknown Carrier",
        "start_time": auction.start_time.isoformat() if auction.start_time else None,
        "end_time": auction.end_time.isoformat() if auction.end_time else None,
        "grading_guide": auction.grading_guide,
        "lots": lots_data
    }
    return jsonify(auction_data), 200

# --- List Client's Won Lots Endpoint ---
@app.route("/my-wins", methods=["GET"])
@client_required # Only authenticated clients can see their wins
def get_my_wins(current_client):
    # Query AuctionWinner table, joining with Lot, Auction, and Bid
    # to get comprehensive details about each win.
    won_items = db.session.query(
        AuctionWinner.awarded_at,
        AuctionWinner.winning_amount,
        Lot.lot_identifier,
        Lot.device_name,
        Lot.device_details,
        Lot.image_url, # Added image_url
        Auction.name.label("auction_name"),
        Auction.end_time.label("auction_end_time"),
        Bid.bid_time.label("winning_bid_time") # Time the winning bid was placed
    ).join(Lot, AuctionWinner.lot_id == Lot.lot_id)\
     .join(Auction, Lot.auction_id == Auction.auction_id)\
     .join(Bid, AuctionWinner.winning_bid_id == Bid.bid_id)\
     .filter(AuctionWinner.user_id == current_client.user_id)\
     .order_by(AuctionWinner.awarded_at.desc())\
     .all()

    output = []
    for item in won_items:
        # The following line for invoice_placeholder_url is problematic because it tries to run queries inside the loop.
        # This is inefficient and can lead to errors if AuctionWinner or Lot models are not fully loaded or available in this context for querying.
        # It's better to fetch all required info in the main query or construct URLs without new queries.
        # For now, I will comment out the problematic part of invoice_placeholder_url.
        # A correct implementation would involve a separate endpoint for invoices or a simpler URL construction.
        # lot_for_invoice = Lot.query.get(AuctionWinner.query.filter_by(awarded_at=item.awarded_at, user_id=current_client.user_id).first().lot_id)
        # auction_id_for_invoice = lot_for_invoice.auction_id
        # lot_id_for_invoice = lot_for_invoice.lot_id

        output.append({
            "awarded_at": item.awarded_at.isoformat() if item.awarded_at else None,
            "winning_amount": float(item.winning_amount),
            "lot_identifier": item.lot_identifier,
            "device_name": item.device_name,
            "device_details": item.device_details,
            "image_url": item.image_url,
            "auction_name": item.auction_name,
            "auction_end_time": item.auction_end_time.isoformat() if item.auction_end_time else None,
            "winning_bid_time": item.winning_bid_time.isoformat() if item.winning_bid_time else None,
            "invoice_placeholder_url": f"/invoices/lot/{item.lot_identifier}" # Simplified placeholder
        })

    return jsonify({"wins": output}), 200

# Function to create a default admin user (if not exists)
def create_default_admin():
    with app.app_context():
        db.create_all()
        if not User.query.filter_by(email='admin@phonescanada.com').first():
            admin_user = User(email='admin@phonescanada.com', role='admin', company_name='PhonesCanada Admin')
            admin_user.set_password('AdminPass123!')
            db.session.add(admin_user)
            db.session.commit()
            print('Default admin user created.')
        else:
            print('Default admin user already exists.')

if __name__ == '__main__':
    create_default_admin()
    app.run(debug=True)
