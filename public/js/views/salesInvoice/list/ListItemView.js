﻿define([
        'text!templates/salesInvoice/list/ListTemplate.html',
        'helpers'
    ],

    function (listTemplate, helpers) {
        var InvoiceListItemView = Backbone.View.extend({
            el: '#listTable',

            initialize: function (options) {
                this.collection = options.collection;
                this.startNumber = (options.page - 1 ) * options.itemsNumber;
            },
            render: function (options) {
                var el = (options && options.thisEl) ? options.thisEl : this.$el;

                el.append(_.template(listTemplate, {
                    invoiceCollection: this.collection.toJSON(),
                    startNumber: this.startNumber,
                    currencySplitter: helpers.currencySplitter
                }));
            }
        });

        return InvoiceListItemView;
    });
