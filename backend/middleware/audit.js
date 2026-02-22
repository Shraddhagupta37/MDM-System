const AuditLog = require('../models/AuditLog');

module.exports = (action, entityType) => {
  return async (req, res, next) => {
    const originalJson = res.json;
    
    res.json = function(data) {
      if (data.success && req.method !== 'GET') {
        // Log the action asynchronously
        AuditLog.create({
          action,
          entityType,
          entityId: req.params.id || data[entityType]?._id,
          userId: req.user?.id,
          userName: req.user?.name,
          changes: req.body,
          metadata: {
            method: req.method,
            path: req.path,
            query: req.query
          },
          ipAddress: req.ip,
          userAgent: req.get('User-Agent')
        }).catch(err => console.error('Audit log error:', err));
      }
      
      originalJson.call(this, data);
    };
    
    next();
  };
};