
Date.prototype.toJSONLocal = function() {
    var local = new Date(this);
    local.setMinutes(this.getMinutes() - this.getTimezoneOffset());
    return local.toJSON().slice(0, 10); // toJSON is not supported in <IE8
};


(function(init, $) {
    $(function () {
        $(window).on('load', function (e) {
            init.inlines();

            init.read();
            init.layout();
            init.theme();
            init.lang();
            
            init.chosen();
            init.datepicker();
        });
    });
}(
(function init ($) {
    var chosen = {
        allow_single_deselect: true,
        no_results_text: 'No results matched!<br /> <a href="#">Click to add</a> ',
        width: '100%'
    };
    function isMobile () {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/gi
            .test(navigator.userAgent);
    }
    function getControl (self) {
        if ($('.jumbotron > input', self).length)
            return $('.jumbotron > input', self);
        if ($('.form-group .form-control', self).length)
            return $('.form-group .form-control', self);
    }
    function getFileControl (self) {
        if ($('.form-group [type=file]', self).length)
            return $('.form-group [type=file]', self);
    }
    function initDatetimePickers (type, ctx) {
        var options = {
            weekStart: 1, autoclose: 1, todayHighlight: 1,
            keyboardNavigation: 0, forceParse: 0, viewSelect: 'decade'
        };
        var controls = [
            {format: 'yyyy-mm-dd',      formatViewType: 'date', startView: 2, minView: 2, maxView: 4},
            {format: 'hh:ii',           formatViewType: 'time', startView: 1, minView: 0, maxView: 1},
            {format: 'yyyy-mm-dd hh:ii',formatViewType: 'date', startView: 2, minView: 0, maxView: 4},
            {format: 'yyyy',            formatViewType: 'date', startView: 4, minView: 4, maxView: 4}
        ];
        var mobile = ['date', 'time', 'datetime', 'date'];

        var selectors = ['.date', '.time', '.datetime-', '.year'];
        for (var i=0; i < selectors.length; i++) {
            selectors[i] = (type == 'static')
                ? 'tr:not(.blank) ' + selectors[i] + 'picker'
                : selectors[i] + 'picker';
        }

        var have = false;
        for (var i=0; i < selectors.length; i++) {
            if ($(selectors[i], ctx).length) {have = true; break;}
        }
        if (!have) return;

        if (isMobile()) {
            for (var i=0; i < selectors.length; i++) {
                $(selectors[i], ctx).each(function (index) {
                    $(this).attr('type', mobile[i]);
                });
            }
        } else {
            for (var i=0; i < selectors.length; i++) {
                $(selectors[i], ctx).datetimepicker($.extend(options, controls[i]));
            }
        }
    }
    return {
        inlines: function () {
            $('.add-another').on('click', function (e) {
                // table and current index
                var name = $(this).data('table'),
                    $table = $('table[data-table="'+name+'"]');
                // get the last index
                var index = $('.head', $table).length-1;
                // clone and set classes
                var $rows = $('.blank', $table).clone();
                $rows.removeClass('blank hidden');

                // set the column keys
                $rows.each(function (idx) {
                    var control = getControl(this),
                        name = control.attr('name') || '';
                    control.attr('name', 
                        name.replace('blank', 'records').replace('index', index));
                    
                    var fileControl = getFileControl(this);
                    if (fileControl)
                    fileControl.attr('name', 
                        name.replace('blank', 'records').replace('index', index));
                });
                // set keys for insert
                (function () {
                    var name = $rows.eq(0).find('input').attr('name');
                    $rows.eq(0).find('input').attr('name',
                        name.replace('blank', 'records').replace('index', index));
                }());
                
                // append
                var tbody = $('tbody', $table);
                $rows.appendTo(tbody);

                // init controls
                if ($('.chosen-select').length)
                    $('.chosen-select', $rows).chosen(chosen);
                initDatetimePickers('dynamic', $rows);
                if (typeof onAddInline === 'function')
                    onAddInline($rows);

                // one
                if ($table.parents('#one').length) {
                    $('tfoot', $table).addClass('hidden');
                }
                return false;
            });
            $('table').on('click', '.remove', function (e) {
                var name = $(this).data('table'),
                    $table = $('table[data-table="'+name+'"]');

                // remove
                var head = $(this).parents('.head'),
                    rows = head.nextUntil('tr.head');
                head.remove();
                rows.remove();

                // re-set the indexes
                $('.head:not(.blank)', $table).each(function (index) {
                    var idx = -1;
                    
                    $('.jumbotron input', this).each(function () {
                        var name = $(this).attr('name');
                        idx = name.match(/.*(\[\d+\]).*/)[1];
                        $(this).attr('name', name.replace(idx, '['+index+']'));
                    });

                    $(this).nextUntil('tr.head').each(function () {

                        var control = getControl(this),
                            name = control.attr('name');
                        control.attr('name', name.replace(idx, '['+index+']'));
                    });
                });
                
                // one
                if ($table.parents('#one').length) {
                    $('tfoot', $table).removeClass('hidden');
                }
                return false;
            });
        },
        layout: function () {
            $('#layout a').on('click', function (e) {
                $('body, #navbar').removeClass();
                var layout = this.hash.slice(1);
                layout == 'fixed'
                    ? $('body, #navbar').addClass('container')
                    : $('body, #navbar').addClass('container container-fluid');
                $('#layout li').removeClass('active');
                $(this).parent().addClass('active');
                localStorage.setItem('layout', layout);
                return false;
            });
        },
        theme: function () {
            var bootstrap = $('#bootstrap');
            $('#theme a').on('click', function (e) {
                var theme = this.hash.slice(1),
                    url = xAdmin.root+'/bootswatch/'+theme+'/bootstrap.min.css';
                bootstrap.attr('href', url);
                $('#theme li').removeClass('active');
                $(this).parent().addClass('active');
                localStorage.setItem('theme', theme);
                return false;
            });
        },
        lang: function () {
            $('#language a').on('click', function (e) {
                var lang = this.hash.slice(1);
                document.cookie = 'lang='+lang;
                window.location.reload(true);
                return false;
            });
        },
        read: function () {
            var layout   = localStorage.getItem('layout')   || 'fixed',
                theme    = localStorage.getItem('theme')    || 'default',
                language = document.cookie.replace('lang=', '');

            $('#layout li').removeClass('active');
            $('#layout [href$="'+layout+'"]').parent().addClass('active');

            $('#theme li').removeClass('active');
            $('#theme [href$="'+theme+'"]').parent().addClass('active');

            $('#language li').removeClass('active');
            $('#language [href$="'+language+'"]').parent().addClass('active');
        },
        chosen: function () {
            if ($('.chosen-select').length)
                $('tr:not(.blank) .chosen-select').chosen(chosen);
        },
        datepicker: function () {
            initDatetimePickers('static', document);
            
            $('body').on('click', 'td .form-group .btn-today', function (e) {
                $(this).parents('td').find('input').val(new Date().toJSONLocal());
                return false;
            });
        }
    };
}(jQuery)), jQuery));
