from app import db, bcrypt # Assuming db, bcrypt are initialized in app
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship # For relationships

# --- User Model (from previous step) ---
class User(db.Model):
    __tablename__ = 'users'
    user_id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(255), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    company_name = db.Column(db.String(255), nullable=True)
    role = db.Column(db.String(50), nullable=False, default='client')
    deposit_status = db.Column(db.String(50), default='pending')
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime(timezone=True), server_default=func.now())
    last_login = db.Column(db.DateTime(timezone=True), nullable=True)

    auctions_created = relationship('Auction', back_populates='creator')
    bids_placed = relationship('Bid', back_populates='bidder')

    def set_password(self, password):
        self.password_hash = bcrypt.generate_password_hash(password).decode('utf-8')

    def check_password(self, password):
        return bcrypt.check_password_hash(self.password_hash, password)

    def __repr__(self):
        return f'<User {self.email}>'

# --- Carrier Model ---
class Carrier(db.Model):
    __tablename__ = 'carriers'
    carrier_id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), nullable=False, unique=True)
    created_at = db.Column(db.DateTime(timezone=True), server_default=func.now())

    auctions = relationship('Auction', back_populates='carrier')

    def __repr__(self):
        return f'<Carrier {self.name}>'

# --- Auction Model ---
class Auction(db.Model):
    __tablename__ = 'auctions'
    auction_id = db.Column(db.Integer, primary_key=True)
    carrier_id = db.Column(db.Integer, db.ForeignKey('carriers.carrier_id'), nullable=False)
    name = db.Column(db.String(255), nullable=False)
    start_time = db.Column(db.DateTime(timezone=True), nullable=False, server_default=func.now())
    end_time = db.Column(db.DateTime(timezone=True), nullable=False)
    status = db.Column(db.String(50), default='scheduled')  # scheduled, active, closed, cancelled
    grading_guide = db.Column(db.Text, nullable=True)
    is_visible = db.Column(db.Boolean, default=False)
    created_by_user_id = db.Column(db.Integer, db.ForeignKey('users.user_id'), nullable=True) # Nullable if system creates some
    created_at = db.Column(db.DateTime(timezone=True), server_default=func.now())
    updated_at = db.Column(db.DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    carrier = relationship('Carrier', back_populates='auctions')
    creator = relationship('User', back_populates='auctions_created')
    lots = relationship('Lot', back_populates='auction', cascade='all, delete-orphan')

    def __repr__(self):
        return f'<Auction {self.name}>'

# --- Lot Model ---
class Lot(db.Model):
    __tablename__ = 'lots'
    lot_id = db.Column(db.Integer, primary_key=True)
    auction_id = db.Column(db.Integer, db.ForeignKey('auctions.auction_id'), nullable=False)
    lot_identifier = db.Column(db.String(255), nullable=False) # E.g., from CSV
    device_name = db.Column(db.String(255), nullable=False)
    device_details = db.Column(db.Text, nullable=True)
    image_url = db.Column(db.String(255), nullable=True)
    condition = db.Column(db.String(255), nullable=True)
    quantity = db.Column(db.Integer, default=1)
    min_bid = db.Column(db.Numeric(10, 2), default=0.00)
    created_at = db.Column(db.DateTime(timezone=True), server_default=func.now())
    updated_at = db.Column(db.DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    auction = relationship('Auction', back_populates='lots')
    bids = relationship('Bid', back_populates='lot', cascade='all, delete-orphan')

    __table_args__ = (db.UniqueConstraint('auction_id', 'lot_identifier', name='_auction_lot_uc'),)

    def __repr__(self):
        return f'<Lot {self.device_name} - {self.lot_identifier}>'

# --- Bid Model (Forward declaration for relationships, will be fully defined later) ---
class Bid(db.Model):
    __tablename__ = 'bids'
    bid_id = db.Column(db.Integer, primary_key=True)
    lot_id = db.Column(db.Integer, db.ForeignKey('lots.lot_id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.user_id'), nullable=False)
    bid_amount = db.Column(db.Numeric(10, 2), nullable=False)
    bid_time = db.Column(db.DateTime(timezone=True), server_default=func.now())
    status = db.Column(db.String(50), default='active') # active, winning, outbid, cancelled

    lot = relationship('Lot', back_populates='bids')
    bidder = relationship('User', back_populates='bids_placed')

    # Unique constraint: one active bid per user per lot
    # This might need adjustment if users can place multiple increasing bids
    # For sealed bids, this is usually one bid per user per lot.
    __table_args__ = (db.UniqueConstraint('lot_id', 'user_id', name='_user_lot_bid_uc'),)

    def __repr__(self):
        return f'<Bid {self.bid_amount} by User {self.user_id} for Lot {self.lot_id}>'


# --- AuctionWinner Model (Forward declaration, will be fully defined later) ---
class AuctionWinner(db.Model):
    __tablename__ = 'auction_winners'
    winner_id = db.Column(db.Integer, primary_key=True)
    lot_id = db.Column(db.Integer, db.ForeignKey('lots.lot_id'), unique=True, nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.user_id'), nullable=False)
    winning_bid_id = db.Column(db.Integer, db.ForeignKey('bids.bid_id'), unique=True, nullable=False)
    winning_amount = db.Column(db.Numeric(10,2), nullable=False)
    awarded_at = db.Column(db.DateTime(timezone=True), server_default=func.now())

    # Relationships (optional, but good for ORM access)
    lot = relationship('Lot', backref=db.backref('winner_info', uselist=False))
    user = relationship('User', backref=db.backref('won_lots_info'))
    bid = relationship('Bid', backref=db.backref('winning_info', uselist=False))

    def __repr__(self):
        return f'<AuctionWinner User {self.user_id} Lot {self.lot_id} Amount {self.winning_amount}>'
