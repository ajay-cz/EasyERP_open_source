define([
    'Underscore',
    'views/topBarViewBase',
    'text!templates/ExpensesInvoice/TopBarTemplate.html',
    'constants'
], function (_, BaseView, ContentTopBarTemplate, CONSTANTS) {
    var TopBarView = BaseView.extend({
        el           : '#top-bar',
        contentType  : CONSTANTS.EXPENSESINVOICE,
        contentHeader: 'Expenses',
        template     : _.template(ContentTopBarTemplate)
    });

    return TopBarView;
});
