const { body, validationResult } = require('express-validator');

exports.validateDeviceHeartbeat = [
  body('imei').notEmpty().withMessage('IMEI is required'),
  body('appVersion').notEmpty().withMessage('App version is required'),
  body('appVersionCode').isNumeric().withMessage('Version code must be numeric'),
  body('deviceOS').notEmpty().withMessage('Device OS is required'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    next();
  }
];

exports.validateVersionCreate = [
  body('versionCode').isNumeric().withMessage('Version code must be numeric'),
  body('versionName').notEmpty().withMessage('Version name is required'),
  body('releaseDate').isISO8601().withMessage('Valid release date is required'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    next();
  }
];