var mongoose = require('mongoose');
var wTrack = function (event, models) {
    var access = require("../Modules/additions/access.js")(models);
    var _ = require('../node_modules/underscore');
    var wTrackSchema = mongoose.Schemas['wTrack'];
    var DepartmentSchema = mongoose.Schemas['Department'];
    var MonthHoursSchema = mongoose.Schemas['MonthHours'];
    var SalarySchema = mongoose.Schemas['Salary'];
    var HolidaySchema = mongoose.Schemas['Holiday'];
    var VacationSchema = mongoose.Schemas['Vacation'];
    /*var CustomerSchema = mongoose.Schemas['Customer'];
     var EmployeeSchema = mongoose.Schemas['Employee'];
     var WorkflowSchema = mongoose.Schemas['workflow'];*/
    var objectId = mongoose.Types.ObjectId;
    var async = require('async');
    var mapObject = require('../helpers/bodyMaper');
    var moment = require('../public/js/libs/moment/moment');

    var exportHandlingHelper = require('../helpers/exporter/exportHandlingHelper');
    var exportMap = require('../helpers/csvMap').wTrack.aliases;
    exportHandlingHelper.addExportFunctionsToHandler(this, function (req) {
        return models.get(req.session.lastDb, 'wTrack', wTrackSchema)
    }, exportMap, "wTrack");

    this.create = function (req, res, next) {
        access.getEditWritAccess(req, req.session.uId, 75, function (access) {
            if (access) {

                var WTrack = models.get(req.session.lastDb, 'wTrack', wTrackSchema);
                var body = mapObject(req.body);

                wTrack = new WTrack(body);

                wTrack.save(function (err, wTrack) {
                    if (err) {
                        return next(err);
                    }

                    event.emit('dropHoursCashes', req);
                    event.emit('recollectVacationDash');
                    event.emit('updateProjectDetails', {req: req, _id: wTrack.project._id});
                    event.emit('recollectProjectInfo');

                    res.status(200).send({success: wTrack});
                });
            } else {
                res.status(403).send();
            }
        });
    };

    this.putchModel = function (req, res, next) {
        var id = req.params.id;
        var data = mapObject(req.body);
        var WTrack = models.get(req.session.lastDb, 'wTrack', wTrackSchema);

        if (req.session && req.session.loggedIn && req.session.lastDb) {
            access.getEditWritAccess(req, req.session.uId, 75, function (access) {
                if (access) {
                    data.editedBy = {
                        user: req.session.uId,
                        date: new Date().toISOString()
                    };

                    if (data && data.revenue) {
                        data.revenue *= 100;
                    }

                    WTrack.findByIdAndUpdate(id, {$set: data}, function (err, response) {
                        if (err) {
                            return next(err);
                        }

                        res.status(200).send({success: 'updated'});
                    });
                } else {
                    res.status(403).send();
                }
            });
        } else {
            res.status(401).send();
        }
    };

    this.putchBulk = function (req, res, next) {
        var body = req.body;
        var uId;
        var WTrack = models.get(req.session.lastDb, 'wTrack', wTrackSchema);

        if (req.session && req.session.loggedIn && req.session.lastDb) {
            uId = req.session.uId;
            access.getEditWritAccess(req, req.session.uId, 75, function (access) {
                if (access) {
                    async.each(body, function (data, cb) {
                        var id = data._id

                        if (data && data.revenue) {
                            data.revenue *= 100;
                        }

                        data.editedBy = {
                            user: uId,
                            date: new Date().toISOString()
                        };
                        delete data._id;
                        WTrack.findByIdAndUpdate(id, {$set: data}, {new: true}, function (err, wTrack) {
                            if (err) {
                                return cb(err);
                            }
                            event.emit('updateProjectDetails', {req: req, _id: wTrack.project._id});
                            event.emit('recollectProjectInfo');
                            cb(null, wTrack);
                        });
                    }, function (err) {
                        if (err) {
                            return next(err);
                        }

                        event.emit('dropHoursCashes', req);
                        res.status(200).send({success: 'updated'});
                    });
                } else {
                    res.status(403).send();
                }
            });
        } else {
            res.status(401).send();
        }
    };

    function ConvertType(array, type) {
        if (type === 'integer') {
            for (var i = array.length - 1; i >= 0; i--) {
                array[i] = parseInt(array[i]);
            }
        } else if (type === 'boolean') {
            for (var i = array.length - 1; i >= 0; i--) {
                if (array[i] === 'true') {
                    array[i] = true;
                } else if (array[i] === 'false') {
                    array[i] = false;
                } else {
                    array[i] = null;
                }
            }
        }
    };

    function caseFilter(filter) {
        var condition;
        var resArray = [];
        var filtrElement = {};
        var key;

        for (var filterName in filter) {
            condition = filter[filterName]['value'];
            key = filter[filterName]['key'];

            switch (filterName) {
                case 'projectManager':
                    filtrElement[key] = {$in: condition.objectID()};
                    resArray.push(filtrElement);
                    break;
                case 'projectName':
                    filtrElement[key] = {$in: condition.objectID()};
                    resArray.push(filtrElement);
                    break;
                case 'customer':
                    filtrElement[key] = {$in: condition.objectID()};
                    resArray.push(filtrElement);
                    break;
                case 'employee':
                    filtrElement[key] = {$in: condition.objectID()};
                    resArray.push(filtrElement);
                    break;
                case 'department':
                    filtrElement[key] = {$in: condition.objectID()};
                    resArray.push(filtrElement);
                    break;
                case 'year':
                    ConvertType(condition, 'integer');
                    filtrElement[key] = {$in: condition};
                    resArray.push(filtrElement);
                    break;
                case 'month':
                    ConvertType(condition, 'integer');
                    filtrElement[key] = {$in: condition};
                    resArray.push(filtrElement);
                    break;
                case 'week':
                    ConvertType(condition, 'integer');
                    filtrElement[key] = {$in: condition};
                    resArray.push(filtrElement);
                    break;
                case 'isPaid':
                    ConvertType(condition, 'boolean');
                    filtrElement[key] = {$in: condition};
                    resArray.push(filtrElement);
                    break;
            }
        }
        ;

        return resArray;
    };

    this.totalCollectionLength = function (req, res, next) {
        var WTrack = models.get(req.session.lastDb, 'wTrack', wTrackSchema);
        var departmentSearcher;
        var contentIdsSearcher;
        var contentSearcher;
        var query = req.query;
        var queryObject = {};
        var filter = query.filter;

        if (filter && typeof filter === 'object') {
            if (filter.condition === 'or') {
                queryObject['$or'] = caseFilter(filter);
            } else {
                queryObject['$and'] = caseFilter(filter);
            }
        }
        var waterfallTasks;

        departmentSearcher = function (waterfallCallback) {
            models.get(req.session.lastDb, "Department", DepartmentSchema).aggregate(
                {
                    $match: {
                        users: objectId(req.session.uId)
                    }
                }, {
                    $project: {
                        _id: 1
                    }
                },

                waterfallCallback);
        };

        contentIdsSearcher = function (deps, waterfallCallback) {
            var arrOfObjectId = deps.objectID();
            var userId = req.session.uId;
            var everyOne = {
                whoCanRW: "everyOne"
            };
            var owner = {
                $and: [
                    {
                        whoCanRW: 'owner'
                    },
                    {
                        'groups.owner': objectId(userId)
                    }
                ]
            };
            var group = {
                $or: [
                    {
                        $and: [
                            {whoCanRW: 'group'},
                            {'groups.users': objectId(userId)}
                        ]
                    },
                    {
                        $and: [
                            {whoCanRW: 'group'},
                            {'groups.group': {$in: arrOfObjectId}}
                        ]
                    }
                ]
            };
            var whoCanRw = [everyOne, owner, group];
            var matchQuery = {
                $and: [
                    queryObject,
                    {
                        $or: whoCanRw
                    }
                ]
            };

            WTrack.aggregate(
                {
                    $match: matchQuery
                },
                {
                    $project: {
                        _id: 1
                    }
                },
                waterfallCallback
            );
        };

        contentSearcher = function (wTrackIDs, waterfallCallback) {
            var queryObject = {_id: {$in: wTrackIDs}};
            var query;

            query = WTrack.count(queryObject);

            query.count(waterfallCallback);
        };

        waterfallTasks = [departmentSearcher, contentIdsSearcher, contentSearcher];

        async.waterfall(waterfallTasks, function (err, result) {
            if (err) {
                return next(err);
            }

            res.status(200).send({count: result});
        });
    };

    this.getByViewType = function (req, res, next) {
        var WTrack = models.get(req.session.lastDb, 'wTrack', wTrackSchema);

        var query = req.query;
        var queryObject = {};
        var filter = query.filter;
        var departmentSearcher;
        var contentIdsSearcher;
        var contentSearcher;
        var waterfallTasks;
        var key;
        var keyForDay;
        var sortObj = {
            "Mo": 1,
            "Tu": 2,
            "We": 3,
            "Th": 4,
            "Fr": 5,
            "Sa": 6,
            "Su": 7
        };

        var sort = {};

        if (filter && typeof filter === 'object') {
            if (filter.condition === 'or') {
                queryObject['$or'] = caseFilter(filter);
            } else {
                queryObject['$and'] = caseFilter(filter);
            }
        }

        var count = query.count ? query.count : 100;
        var page = query.page;
        var skip = (page - 1) > 0 ? (page - 1) * count : 0;

        if (query.sort) {
            key = Object.keys(query.sort)[0];
            keyForDay = sortObj[key];

            if (key in sortObj) {
                sort[keyForDay] = query.sort[key];
            } else {
                sort = query.sort;
            }
        } else {
            sort = {"project.projectName": 1, "year": 1, "month": 1, "week": 1};
        }

        departmentSearcher = function (waterfallCallback) {
            models.get(req.session.lastDb, "Department", DepartmentSchema).aggregate(
                {
                    $match: {
                        users: objectId(req.session.uId)
                    }
                }, {
                    $project: {
                        _id: 1
                    }
                },

                waterfallCallback);
        };

        contentIdsSearcher = function (deps, waterfallCallback) {
            var arrOfObjectId = deps.objectID();
            var userId = req.session.uId;
            var everyOne = {
                whoCanRW: "everyOne"
            };
            var owner = {
                $and: [
                    {
                        whoCanRW: 'owner'
                    },
                    {
                        'groups.owner': objectId(userId)
                    }
                ]
            };
            var group = {
                $or: [
                    {
                        $and: [
                            {whoCanRW: 'group'},
                            {'groups.users': objectId(userId)}
                        ]
                    },
                    {
                        $and: [
                            {whoCanRW: 'group'},
                            {'groups.group': {$in: arrOfObjectId}}
                        ]
                    }
                ]
            };
            var whoCanRw = [everyOne, owner, group];
            var matchQuery = {
                $and: [

                    queryObject,
                    {
                        $or: whoCanRw
                    }
                ]
            };

            WTrack.aggregate(
                {
                    $match: matchQuery
                },
                {
                    $project: {
                        _id: 1
                    }
                },
                waterfallCallback
            );
        };

        contentSearcher = function (wtrackIds, waterfallCallback) {
            var queryObject = {_id: {$in: wtrackIds}};

            WTrack
                .find(queryObject)
                .limit(count)
                .skip(skip)
                .sort(sort)
                .lean()
                .exec(waterfallCallback);
        };

        waterfallTasks = [departmentSearcher, contentIdsSearcher, contentSearcher];

        access.getReadAccess(req, req.session.uId, 75, function (access) {
            if (!access) {
                return res.status(403).send();
            }

            async.waterfall(waterfallTasks, function (err, result) {
                if (err) {
                    return next(err);
                }

                res.status(200).send(result);
            });
        });
    };

    this.getById = function (req, res, next) {
        var id = req.params.id;
        var Quotation = models.get(req.session.lastDb, 'Quotation', QuotationSchema);
        /* var queryParams = {};
         for (var i in req.query) {
         queryParams[i] = req.query[i];
         }*/

        var departmentSearcher;
        var contentIdsSearcher;
        var contentSearcher;
        var waterfallTasks;

        var contentType = req.query.contentType;
        var isOrder = !!(contentType === 'Order');

        /* var data = {};
         for (var i in req.query) {
         data[i] = req.query[i];
         }*/

        departmentSearcher = function (waterfallCallback) {
            models.get(req.session.lastDb, "Department", DepartmentSchema).aggregate(
                {
                    $match: {
                        users: objectId(req.session.uId)
                    }
                }, {
                    $project: {
                        _id: 1
                    }
                },

                waterfallCallback);
        };

        contentIdsSearcher = function (deps, waterfallCallback) {
            var arrOfObjectId = deps.objectID();

            models.get(req.session.lastDb, "Quotation", QuotationSchema).aggregate(
                {
                    $match: {
                        $and: [
                            /*optionsObject,*/
                            {
                                $or: [
                                    {
                                        $or: [
                                            {
                                                $and: [
                                                    {whoCanRW: 'group'},
                                                    {'groups.users': objectId(req.session.uId)}
                                                ]
                                            },
                                            {
                                                $and: [
                                                    {whoCanRW: 'group'},
                                                    {'groups.group': {$in: arrOfObjectId}}
                                                ]
                                            }
                                        ]
                                    },
                                    {
                                        $and: [
                                            {whoCanRW: 'owner'},
                                            {'groups.owner': objectId(req.session.uId)}
                                        ]
                                    },
                                    {whoCanRW: "everyOne"}
                                ]
                            }
                        ]
                    }
                },
                {
                    $project: {
                        _id: 1
                    }
                },
                waterfallCallback
            );
        };

        contentSearcher = function (quotationsIds, waterfallCallback) {
            var queryObject = {_id: id};
            var query;

            queryObject.isOrder = isOrder;
            query = Quotation.findOne(queryObject);

            query.populate('supplier', '_id name fullName');
            query.populate('destination');
            query.populate('incoterm');
            query.populate('invoiceControl');
            query.populate('paymentTerm');
            query.populate('products.product', '_id, name');
            query.populate('groups.users');
            query.populate('groups.group');
            query.populate('groups.owner', '_id login');
            query.populate('workflow', '-sequence');
            query.populate('deliverTo', '_id, name');

            query.exec(waterfallCallback);
        };

        waterfallTasks = [departmentSearcher, contentIdsSearcher, contentSearcher];

        access.getReadAccess(req, req.session.uId, 75, function (access) {
            if (!access) {
                return res.status(403).send();
            }

            async.waterfall(waterfallTasks, function (err, result) {
                if (err) {
                    return next(err);
                }

                res.status(200).send(result);
            });
        });
    };

    this.remove = function (req, res, next) {
        var id = req.params.id;
        var WTrack = models.get(req.session.lastDb, 'wTrack', wTrackSchema);
        access.getDeleteAccess(req, req.session.uId, 72, function (access) {
            if (access) {
                WTrack.findByIdAndRemove(id, function (err, wTrack) {
                    if (err) {
                        return next(err);
                    }

                    event.emit('dropHoursCashes', req);
                    event.emit('recollectVacationDash');
                    event.emit('updateProjectDetails', {req: req, _id: wTrack.project._id});
                    event.emit('recollectProjectInfo');

                    res.status(200).send({success: wTrack});
                });
            } else {
                res.status(403).send();
            }
        });
    };

    this.getForProjects = function (req, res, next) {
        var WTrack = models.get(req.session.lastDb, 'wTrack', wTrackSchema);
        var monthHours = models.get(req.session.lastDb, 'MonthHours', MonthHoursSchema);

        var query = req.query;
        var queryObject = {};
        var filter = query.filter;
        var departmentSearcher;
        var contentIdsSearcher;
        var contentSearcher;
        var waterfallTasks;
        var key;
        var keyForDay;
        var months = [];
        var years = [];
        var uMonth;
        var uYear;
        var sortObj = {
            "Mo": 1,
            "Tu": 2,
            "We": 3,
            "Th": 4,
            "Fr": 5,
            "Sa": 6,
            "Su": 7
        };

        var sort = {};

        if (filter && typeof filter === 'object') {
            if (filter.condition === 'or') {
                queryObject['$or'] = caseFilter(filter);
            } else {
                queryObject['$and'] = caseFilter(filter);
            }
        }

        var count = query.count ? query.count : 100;
        var page = query.page ? query.page : 1;
        ;
        var skip = (page - 1) > 0 ? (page - 1) * count : 0;

        if (query.sort) {
            key = Object.keys(query.sort)[0];
            keyForDay = sortObj[key];

            if (key in sortObj) {
                sort[keyForDay] = query.sort[key];
            } else {
                sort = query.sort;
            }
        } else {
            sort = {"project.projectName": 1, "year": 1, "month": 1, "week": 1};
        }

        departmentSearcher = function (waterfallCallback) {
            models.get(req.session.lastDb, "Department", DepartmentSchema).aggregate(
                {
                    $match: {
                        users: objectId(req.session.uId)
                    }
                }, {
                    $project: {
                        _id: 1
                    }
                },

                waterfallCallback);
        };

        contentIdsSearcher = function (deps, waterfallCallback) {
            var arrOfObjectId = deps.objectID();
            var userId = req.session.uId;
            var everyOne = {
                whoCanRW: "everyOne"
            };
            var owner = {
                $and: [
                    {
                        whoCanRW: 'owner'
                    },
                    {
                        'groups.owner': objectId(userId)
                    }
                ]
            };
            var group = {
                $or: [
                    {
                        $and: [
                            {whoCanRW: 'group'},
                            {'groups.users': objectId(userId)}
                        ]
                    },
                    {
                        $and: [
                            {whoCanRW: 'group'},
                            {'groups.group': {$in: arrOfObjectId}}
                        ]
                    }
                ]
            };
            var whoCanRw = [everyOne, owner, group];
            var matchQuery = {
                $and: [

                    queryObject,
                    {
                        $or: whoCanRw
                    }
                ]
            };

            WTrack.aggregate(
                {
                    $match: matchQuery
                },
                {
                    $project: {
                        _id: 1
                    }
                },
                waterfallCallback
            );
        };

        contentSearcher = function (wtrackIds, waterfallCallback) {
            var queryObject = {_id: {$in: wtrackIds}};

            WTrack
                .find(queryObject)
                .limit(count)
                .skip(skip)
                .sort(sort)
                .lean()
                .exec(waterfallCallback);
        };

        waterfallTasks = [departmentSearcher, contentIdsSearcher, contentSearcher];

        access.getReadAccess(req, req.session.uId, 75, function (access) {
            if (!access) {
                return res.status(403).send();
            }

            async.waterfall(waterfallTasks, function (err, result) {
                if (err) {
                    return next(err);
                }
                result.forEach(function (res) {
                    months.push(res.month);
                    years.push(res.year);
                });

                uMonth = _.uniq(months);
                uYear = _.uniq(years);

                monthHours.aggregate([{
                    $match: {
                        year: {$in: uYear},
                        month: {$in: uMonth}
                    }
                }, {
                    $project: {
                        date: {$add: [{$multiply: ["$year", 100]}, "$month"]},
                        hours: '$hours'

                    }
                }, {
                    $group: {
                        _id: '$date',
                        value: {$addToSet: '$hours'}
                    }
                }], function (err, months) {
                    if (err) {
                        return next(err);
                    }

                    res.status(200).send({wTrack: result, monthHours: months});
                });

            });
        });
    };

    this.generateWTrack = function (req, res, next) {
        var WTrack = models.get(req.session.lastDb, 'wTrack', wTrackSchema);
        var body;
        var data = req.query;
        var employee = data.employee;
        var project = data.project;
        var department = data.department;
        var revenue = data.revenue;
        var totalHours = data.totalHours;
        var weekDefault = data.trackWeek;
        var dateArray;
        var wTrackObj;
        var weekCount;
        var revenueForWeek;
        var monthsArr = [];
        var weeksArr = [];
        var yearsArr = [];
        var uniqMonths;
        var uniqWeeks;
        var uniqYears;
        var options = {
            startDate: data.startDate,
            endDate: data.endDate,
            hours: data.hours
        };

        dateArray = this.calculateWeeks(options);

        dateArray.forEach(function(obj){
            monthsArr.push(obj.month);
            weeksArr.push(obj.week);
            yearsArr.push(obj.year);
        });

        uniqMonths = _.uniq(monthsArr);
        uniqWeeks = _.uniq(weeksArr);
        uniqYears = _.uniq(yearsArr);

        weekCount = dateArray.length;
        revenueForWeek = parseFloat(revenue) / weekCount;

        dateArray.forEach(function (element) {
            var year = element.year;
            var month = element.month;
            var week = element.week;
            var dateByWeek = year * 100 + week;
            var dateByMonth = year * 100 + month;
            var parallelTasks = [getHolidays, getVacations, calcCost];


            async.parallel(parallelTasks, function (err, result) {
                var holidays = result[0];
                var vacations = result[1];
                var cost = result[2];
                var trackWeek = {
                    1: ((vacations[dateByMonth] && vacations[dateByMonth]['1']) ? vacations[dateByMonth]['1'] : weekDefault['1']) ? ((holidays[dateByWeek] && holidays[dateByWeek]['1']) ? holidays[dateByWeek]['1'] : weekDefault['1']) : weekDefault['1'],
                    2: ((vacations[dateByMonth] && vacations[dateByMonth]['2']) ? vacations[dateByMonth]['2'] : weekDefault['2']) ? ((holidays[dateByWeek] && holidays[dateByWeek]['2']) ? holidays[dateByWeek]['2'] : weekDefault['2']) : weekDefault['2'],
                    3: ((vacations[dateByMonth] && vacations[dateByMonth]['3']) ? vacations[dateByMonth]['3'] : weekDefault['3']) ? ((holidays[dateByWeek] && holidays[dateByWeek]['3']) ? holidays[dateByWeek]['3'] : weekDefault['3']) : weekDefault['3'],
                    4: ((vacations[dateByMonth] && vacations[dateByMonth]['4']) ? vacations[dateByMonth]['4'] : weekDefault['4']) ? ((holidays[dateByWeek] && holidays[dateByWeek]['4']) ? holidays[dateByWeek]['4'] : weekDefault['4']) : weekDefault['4'],
                    5: ((vacations[dateByMonth] && vacations[dateByMonth]['5']) ? vacations[dateByMonth]['5'] : weekDefault['5']) ? ((holidays[dateByWeek] && holidays[dateByWeek]['5']) ? holidays[dateByWeek]['5'] : weekDefault['5']) : weekDefault['5'],
                    6: weekDefault['6'],
                    7: weekDefault['7']
                };

                wTrackObj = {
                    dateByWeek: dateByWeek,
                    dateByMonth: dateByMonth,
                    project: project,
                    employee: employee,
                    department: department,
                    year: year,
                    month: month,
                    week: week,
                    worked: totalHours,
                    revenue: revenueForWeek,
                    cost: cost,
                    rate: (revenue / worked).toFixed(2),
                    1: trackWeek['1'],
                    2: trackWeek['2'],
                    3: trackWeek['3'],
                    4: trackWeek['4'],
                    5: trackWeek['5'],
                    6: trackWeek['6'],
                    7: trackWeek['7']
                };

                body = mapObject(req.body);

                wTrack = new WTrack(body);

                wTrack.save(function (err, wTrack) {
                    if (err) {
                        return next(err);
                    }
                });
            });
        });

        event.emit('updateProjectDetails', {req: req, _id: project._id});
        event.emit('dropHoursCashes', req);
        event.emit('recollectVacationDash');
        event.emit('recollectProjectInfo');

        function getHolidays(callback){
            var Holiday = models.get(req.session.lastDb, 'Holiday', HolidaySchema);
            var newResult = {};
            var query = Holiday.find({year: {$in: uniqYears}, week: {$in: uniqWeeks}}).lean();

            query.exec(function(err, result){
                if (err){
                    callback(err);
                }

                result.forEach(function (element) {
                    var date = element.date;
                    var year = element.year;
                    var week = element.week;
                    var key = year * 100 + week;
                    var dayOfWeek = moment(date).day();

                    if (!newResult[key]){
                        newResult[key] = {};
                    }
                    newResult[key][dayOfWeek + 1] = dayOfWeek + 1;
                });

                callback(null, newResult);
            });
        };

        function getVacations(callback){
            var Vacation = models.get(req.session.lastDb, 'Vacation', VacationSchema);
            var newResult = {};
            var query = Vacation.find({month: {$in: monthsArr}, year: {$i: yearsArr}, "employee._id": employee._id}, {month: 1, year: 1, vacArr: 1}).lean();

            query.exec(function(err, result){
                if (err){
                    callback(err);
                }

                result.forEach(function (element) {
                    var vacArr = element.vacArr;
                    var year = element.year;
                    var month = element.month;
                    var weekKey;
                    var dayNumber;
                    var dateValue;

                    for (var day = vacArr.length; day >= 0; day--) {
                        if (vacArr[day]) {
                            dateValue = moment([year, month - 1, day + 1]);
                            weekKey = year * 100 + moment(dateValue).isoWeek();

                            dayNumber = moment(dateValue).day();

                            if (dayNumber !== 0 && dayNumber !== 6) {
                                newResult[weekKey] ? newResult[weekKey][dayNumber + 1] =  dayNumber + 1: newResult[weekKey] = {};
                            }
                        }
                    }
                });

                callback(null, newResult);
            });
        }

        function calcCost(callback) {
            var req = req;
            var year = year;
            var month = month;
            var cost;

            var waterfallTasks = [getBaseSalary];
            var wTrack = models.get(req.session.lastDb, "wTrack", wTrackSchema);
            var monthHours = models.get(req.session.lastDb, "MonthHours", MonthHoursSchema);

            function getBaseSalary(cb) {
                var Salary = models.get(req.session.lastDb, 'Salary', SalarySchema);
                var query = Salary
                    .find(
                    {
                        'employee._id': ObjectId(employee._id),
                        month: month,
                        year: year
                    }, {
                        baseSalary: 1,
                        'employee._id': 1
                    })
                    .lean();
                query.exec(function (err, salary) {
                    if (err) {
                        return cb(err);
                    }

                    cb(null, salary.toJSON().baseSalary)
                });
            };
            async.waterfall(waterfallTasks, function (err, result) {
                var baseSalary = result[0];
                var fixedExpense;
                var expenseCoefficient;
                var hoursForMonth;

                if (err) {
                    return console.log(err);
                }

                var query = monthHours.find({month: month, year: year}).lean();

                query.exec(function (err, monthHour) {
                    if (err) {
                        return console.log(err);
                    }
                    if (monthHour[0]) {
                        fixedExpense = parseInt(monthHour[0].fixedExpense);
                        expenseCoefficient = parseFloat(monthHour[0].expenseCoefficient);
                        hoursForMonth = parseInt(monthHour[0].hours);
                    } else {
                        fixedExpense = 0;
                        expenseCoefficient = 0;
                        hours = 1;
                    }

                    cost = ((((baseSalary * expenseCoefficient) + fixedExpense) / hoursForMonth) * totalHours).toFixed(2);

                    callback(null, parseFloat(cost) * 100);
                });

            });
        }

        res.status(200).send('success');
    },

        this.calculateWeeks = function (options) {
            var data = options;
            var startDate = data.startDate;
            var endDate = data.endDate;
            var hours = data.hours;
            var diff;
            var result = [];
            var endYear;
            var endMonth;
            var endWeek;
            var weekNumber;
            var newDate;
            var startYear = moment(startDate).year();
            var startWeek = moment(startDate).isoWeek();
            var isoWeeks = moment(startYear).isoWeeksInYear();

            if (endDate) {
                endYear = moment(endDate).year();
                endMonth = moment(endDate).month();
                endWeek = moment(endDate).isoWeek();

            } else {
                var date = startDate;

                endYear = startYear;
                weekNumber = hours / 40;
                endWeek = startWeek + Math.round(weekNumber) - 1;

                if (endWeek > isoWeeks) {
                    endWeek = endWeek - isoWeeks;
                    endYear = startYear + 1;
                    date = moment(startDate).year(startYear + 1);
                }

                newDate = moment(date).isoWeek(endWeek);
                endMonth = moment(newDate).month();
                endDate = moment().year(endYear).month(endMonth).isoWeek(endWeek);
            }

            diff = endWeek - startWeek;

            if (diff < 0) {
                diff = isoWeeks - startWeek;
                result = result.concat(setObj(diff, isoWeeks, startDate, startYear));
                diff = endWeek - 1;
                result = result.concat(setObj(diff, endWeek, endDate, startYear + 1));
            } else {
                result = result.concat(setObj(diff, endWeek, startDate, startYear));
            }

            function setObj(diff, endWeek, date, year) {
                var result = [];

                for (var i = diff; i >= 0; i--) {
                    var obj = {};
                    var newDate;

                    obj.week = endWeek - i;
                    newDate = moment(date).isoWeek(obj.week);
                    obj.month = moment(newDate).month() + 1;
                    obj.year = year;

                    result.push(obj);
                }

                return result;
            }

            return result;
        }
};

module.exports = wTrack;