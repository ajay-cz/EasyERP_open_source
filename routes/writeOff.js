var express = require('express');
var router = express.Router();
var ExpensesInvoiceHandler = require('../handlers/writeOff');
var authStackMiddleware = require('../helpers/checkAuth');
var MODULES = require('../constants/modules');

module.exports = function (models, event) {
    'use strict';
    
    var handler = new ExpensesInvoiceHandler(models, event);
    var moduleId = MODULES.WRITEOFF;
    var accessStackMiddleWare = require('../helpers/access')(moduleId, models);

    router.use(authStackMiddleware);

    router.post('/', accessStackMiddleWare, handler.create);

    return router;
};
