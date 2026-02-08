const db = require('../config/db');

exports.isAdmin = (req, res, next) => {
    const userId = req.user.id;
    
    db.get(
        'SELECT is_admin FROM users WHERE id = ?',
        [userId],
        (err, row) => {
            if (err) {
                return res.status(500).json({ error: 'Database error' });
            }
            
            if (!row || !row.is_admin) {
                return res.status(403).json({ error: 'Admin access required' });
            }
            
            // User is admin, proceed to next middleware/route handler
            next();
        }
    );
};