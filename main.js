(function ($) {
    $.me = {
        sid:null,
        table:null,
        test:null,
        url:"/webphp/hchan/dksd/stock_analysis.php",
        requestData: {dataType:'list',stockid:null,stockname:null,market:null},
        bgColor: null,
        stk_id: null,
        reason:{},
        trianglecolor0:'rgb(180,0,0)',
        trianglecolor1:'#00ff00',
        options: {
            dataZoomStart: 80,
            dataZoomEnd: 100,
            chars: []
        },
        init:function(){
            //参数
            var params = $.me.GetUrlParam();
            if (params['sid']) {
                $.me.sid                =   params['sid'];
            }
            if (params['table']) {
                $.me.table              =   params['table'];
                $('select.dk-cls').val($.me.table);
                $('#flag').html($('select.dk-cls  option:selected').text());
            }

            var clientWidth  =   document.documentElement.clientWidth;       //可视窗口 - 宽
            var bodyWidth    =   (clientWidth < 880)?830:clientWidth-50;        //页面内容大小 - 宽
            $('#content').css('width',bodyWidth+'px');
            $('.deal_div,#info-list-div,#bar-desc').css('width',(bodyWidth-20)+'px');

            window.onscroll = function(e) {
                if (document.documentElement && document.documentElement.scrollTop || document.body.scrollTop) {
                    $("#_return_top").show();
                } else {
                    $("#_return_top").hide();
                }
            }
            $.me.option1 = {
                tooltip: {
                    trigger: 'axis',
                    axisPointer: {
                        type: 'line'
                    },
                    position: function (point, params, dom) {
                        var myChart = echarts.init(document.getElementById('stockbigk'));
                        var xAxisTotalLength = document.getElementById('stockbigk').offsetWidth - myChart.getOption().xAxis[0].axisLabel.margin;
                        if(point[0]>748){
                            $('#jydesc').removeAttr('style').css({
                                    'position':'absolute',
                                    'top':'-25px',
                                    'width':'500px',
                                    'height':'25px',
                                    'line-height':'25px',
                                    'text-align':'right',
                                    'right':(xAxisTotalLength - point[0])+'px'});
                        }else{
                            $('#jydesc').removeAttr('style').css({
                                'position':'absolute',
                                'top':'-25px',
                                'width':'500px',
                                'height':'25px',
                                'line-height':'25px',
                                'text-align':'left',
                                'left':point[0]+'px'});
                        }
                        // 固定在顶部
                        if (point[0] < 200) {
                            return [point[0] + 30, 30]
                        } else {
                            return [64, 30];
                        }
                    },
                    transitionDuration: 0,
                    formatter: function (params) {
                        if (!params[0]) return;
                        var res = ((params[0].name.indexOf(':') == -1) ? params[0].name : (params[0].name.substring(0, 4) + ' ' + params[0].name.substring(4, 16).replace('/', '-'))) + '</br>' + 'k线';
                        res += '</br>  开盘 : ' + params[0].value[1] + '</br>  收盘 : ' + params[0].value[2];
                        res += '<br/>  最高 : ' + params[0].value[3] + '</br>  最低 : ' + params[0].value[4];
                        if($.me.reason[params[0].name]){
                            $('#jydesc').html("交易描述："+$.me.reason[params[0].name]);
                        }else{
                            $('#jydesc').html('');
                        }
                        return res
                    }
                },
                legend: {
                    show: true,
                    padding: 20
                },
                grid: {
                    x: 60,
                    y: 10,
                    x2: 44,
                    y2: 25
                },
                dataZoom: [
                    {
                        type: 'inside',
                        realtime: true,
                        start: $.me.options.dataZoomStart,
                        end: $.me.options.dataZoomEnd
                    },
                    {
                        type: 'slider',
                        realtime: true,
                        start: $.me.options.dataZoomStart,
                        end: $.me.options.dataZoomEnd
                    }
                ],
                xAxis: {
                    type: 'category',
                    boundaryGap: true,
                    data: null,
                    axisTick: {
                        alignWithLabel: true
                    },
                    axisLabel: {
                        formatter: function (value, index) {
                            if (value.indexOf(':') !== -1) {
                                if (value.indexOf(self.xAxis) == -1) {
                                    self.xAxis = value.substring(0, 6);
                                    return self.xAxis.substring(2, 4) + '/' + self.xAxis.substring(4, 6);
                                } else {
                                    return value.substring(10, 15)
                                }
                            } else {
                                return value
                            }
                        }
                    }
                },
                yAxis: {
                    type: 'value',
                    boundaryGap: [0.001, 0.001],
                    splitNumber: 4,
                    scale: true,
                    axisLine: {
                        lineStyle: {
                            color: '#8392A5'
                        }
                    },
                    splitLine: {
                        show: true
                    }
                },
                series: [
                    {
                        name: 'K线',
                        silent: true,
                        type: 'candlestick',
                        data: null,
                        markLine: {
                            symbol: '',
                            large: true,
                            label: {
                                normal: {
                                    show: false
                                }
                            },
                            data: null
                        },
                        itemStyle: {
                            normal: {
                                color: 'rgb(255,97,97)',// red #eb1b23
                                color0: '#239c19',//  #157E15
                                borderColor: 'rgb(255,97,97)',//red #eb1b23
                                borderColor0: '#239c19',//#157E15
                            }
                        },
                        markArea: {
                            symbol: '',
                            large: true,
                            label: {
                                normal: {
                                    show: false
                                }
                            },
                            data: null
                        },
                        animation: false
                    },
                    {
                        name: '',
                        type: 'scatter',// scatter
                        data: null,
                        color:$.me.trianglecolor1,//green
                        smooth: true,
                        symbol:'emptyTriangle',
                        symbolSize: 8,
                        symbolRotate: '-180',
                        lineStyle: {
                            opacity: 0.5
                        },
                        label: {
                            show: true,
                            position:'top',
                            formatter: function (params) {
                                return params.data[2];
                                /*return params.data[2]+' '+params.data[1];*/
                            },
                            textStyle: {
                                fontSize: 10,
                                color: $.me.trianglecolor1,
                            },
                        },
                        markLine:
                            {
                                silent: false,
                                symbol: 'none',
                                data: []
                            }

                    },//部分平
                    {
                        name: '',
                        type: 'scatter',// scatter
                        data: null,
                        color:$.me.trianglecolor1,
                        smooth: true,
                        symbol:'emptyTriangle',
                        symbolSize: 8,
                        symbolRotate: '-180',
                        lineStyle: {
                            opacity: 0.5
                        },
                        label: {
                            show: true,
                            position:'top',
                            formatter: function (params) {
                                return params.data[2];
                                /*return params.data[2]+' '+params.data[1];*/
                            },
                            textStyle: {
                                fontSize: 10,
                                color: $.me.trianglecolor1,
                            },
                        },
                        markLine:
                            {
                                silent: false,
                                symbol: 'none',
                                data: []
                            }

                    },//部分平 重合时间
                    {
                        name: '',
                        type: 'scatter',// scatter
                        data: null,
                        smooth: true,
                        color: $.me.trianglecolor1,
                        symbol:'triangle',
                        symbolSize: 8,
                        symbolRotate: '-180',
                        lineStyle: {
                            opacity: 0.5
                        },
                        label: {
                            show: true,
                            position:'top',
                            formatter: function (params) {
                                return params.data[2];
                                /*return params.data[2]+' '+params.data[1];*/
                            },
                            textStyle: {
                                fontSize: 10,
                                color: $.me.trianglecolor1,
                            },
                        },
                        markLine:
                            {
                                silent: false,
                                symbol: 'none',
                                data: []
                            }

                    },//全平
                    {
                        name: '',
                        type: 'scatter',// scatter
                        data: null,
                        smooth: true,
                        color:$.me.trianglecolor1,
                        symbol:'triangle',
                        symbolSize: 8,
                        symbolRotate: '-180',
                        lineStyle: {
                            opacity: 0.5
                        },
                        label: {
                            show: true,
                            position:'top',
                            formatter: function (params) {
                                return params.data[2];
                                /*return params.data[2]+' '+params.data[1];*/
                            },
                            textStyle: {
                                fontSize: 10,
                                color: $.me.trianglecolor1,
                            },
                        },
                        markLine:
                            {
                                silent: false,
                                symbol: 'none',
                                data: []
                            }

                    },//全平 重合时间
                    {
                        name: '',
                        type: 'scatter',// scatter
                        data: null,
                        smooth: true,
                        color: $.me.trianglecolor0,
                        symbol:'triangle',
                        symbolSize: 8,
                        lineStyle: {
                            opacity: 0.5
                        }, style: {
                            fill: null, // 填充色设置为 null，表示不填充颜色
                        },
                        label: {
                            show: true,
                            position:'bottom',
                            formatter: function (params) {
                                return params.data[2];
                                /*return params.data[2]+' '+params.data[1];*/
                            },
                            textStyle: {
                                fontSize: 10,
                                color: $.me.trianglecolor0,
                            },
                        },
                        markLine:
                            {
                                silent: false,
                                symbol: 'none',
                                data: []
                            }

                    },//首开
                    {
                        name: '',
                        type: 'scatter',// scatter
                        data: null,
                        smooth: true,
                        color: $.me.trianglecolor0,
                        symbol:'triangle',
                        symbolSize: 8,
                        lineStyle: {
                            opacity: 0.5
                        },
                        label: {
                            show: true,
                            position:'bottom',
                            formatter: function (params) {
                                return params.data[2]+' '+params.data[1];
                            },
                            textStyle: {
                                fontSize: 10,
                                color: $.me.trianglecolor0,
                            },
                        },
                        markLine:
                            {
                                silent: false,
                                symbol: 'none',
                                data: []
                            }

                    },//首开 重合时间
                    {
                        name: '',
                        type: 'scatter',// scatter
                        data: null,
                        smooth: true,
                        color: $.me.trianglecolor0,
                        symbol:'emptyTriangle',
                        symbolSize: 8,
                        lineStyle: {
                            opacity: 0.5
                        },
                        label: {
                            show: true,
                            position:'bottom',
                            formatter: function (params) {
                                return params.data[2];
                                /*return params.data[2]+' '+params.data[1];*/
                            },
                            textStyle: {
                                fontSize: 10,
                                color: $.me.trianglecolor0,
                            },
                        },
                        markLine:
                            {
                                silent: false,
                                symbol: 'none',
                                data: []
                            }

                    },//加开
                    {
                        name: '',
                        type: 'scatter',// scatter
                        data: null,
                        smooth: true,
                        color: $.me.trianglecolor0,
                        symbol:'emptyTriangle',
                        symbolSize: 8,
                        lineStyle: {
                            opacity: 0.5
                        },
                        label: {
                            show: true,
                            position:'bottom',
                            formatter: function (params) {
                                return params.data[2];
                                /*return params.data[2]+' '+params.data[1];*/
                            },
                            textStyle: {
                                fontSize: 10,
                                color: $.me.trianglecolor0,
                            },
                        },
                        markLine:
                            {
                                silent: false,
                                symbol: 'none',
                                data: []
                            }

                    },//加开 重合时间
                ]
            };
            $.me.option2 = {
                series:[
                    {
                        name: '净值',
                        type: 'line',
                        itemStyle: {
                            color: '#000'
                        },
                        data: null,
                        yAxisIndex: 0,
                        animation: true,
                        connectNulls: true,
                        z: 10 // 设置 z 值，确保它显示在上面
                    },
                    {
                        name: '仓位比',
                        type: 'bar',
                        itemStyle: {
                            color: '#c23531'
                        },
                        data: null,
                        yAxisIndex: 1,
                        animation: true,
                        connectNulls: true
                    },
                    {
                        name: '持仓量',
                        type: 'bar',
                        itemStyle: {
                            //color: '#c23531'
                            color: 'rgba(0, 0, 255, 0)'
                        },
                        yAxisIndex: 2,
                        data: null,
                        animation: true,
                        connectNulls: true
                    },
                    {
                        name: '股价变化',
                        type: 'line',
                        itemStyle: {
                            color: '#999'
                        },
                        data: null,
                        yAxisIndex: 0,
                        animation: true,
                        connectNulls: true,
                        z: 5 // 设置 z 值，确保它显示在上面
                    }
                ],
                tooltip: {
                    trigger: 'axis',
                    axisPointer: {
                        type: 'line'
                    },
                    position: function (point, params, dom) {
                        // 固定在顶部
                        if (!params[0]) return;
                        if (point[0] < 200) {
                            return [point[0] + 30, 15]
                        } else {
                            return [64, 15];
                        }
                    },
                    transitionDuration: 0,
                    formatter: function (params) {
                        var res = '';
                        res +=  params[0].name;
                        res += '</br>  净值 : ' + (params[0].value?params[0].value:'-');
                        res += '</br>  仓位比 : ' + (params[1].value?params[1].value:'-');
                        res += '</br>  持仓量 : ' + (params[2].value?params[2].value:'-');
                        res += '</br>  股价变化 : ' + (params[3].value?params[3].value:'-');
                        return res;
                    }
                },
                axisPointer: {
                    type: 'line'
                },
                legend: {
                    show: true,
                    padding: 20,
                    left: 20,
                    data: []
                },
                grid: {
                    x: 60,
                    y: 10,
                    x2: 44,
                    y2: 10
                },
                dataZoom: [{
                    type: 'inside',
                    realtime: true,
                    xAxisIndex: 0,
                    start: $.me.options.dataZoomStart,
                    end: $.me.options.dataZoomEnd
                },{
                    type: 'inside',
                    realtime: true,
                    xAxisIndex: 0,
                    start: $.me.options.dataZoomStart,
                    end: $.me.options.dataZoomEnd
                }, {
                    show: false,
                    type: 'slider',
                    realtime: true,
                    xAxisIndex: 0,
                    start: $.me.options.dataZoomStart,
                    end: $.me.options.dataZoomEnd
                }, {
                    show: false,
                    type: 'slider',
                    realtime: true,
                    xAxisIndex: 0,
                    start: $.me.options.dataZoomStart,
                    end: $.me.options.dataZoomEnd
                }],
                toolbox: {
                    feature: {
                        saveAsImage: {
                            show:false//控制保存按钮显示隐藏
                        }
                    }
                },
                xAxis: {
                    show: false,
                    type: 'category',
                    boundaryGap: true,
                    axisTick: {
                        alignWithLabel: true
                    },
                    data: {}
                },
                yAxis: [
                    {
                        type: 'value',
                        position: 'left',
                        name: '净值',
                        axisLabel: {
                            formatter: '{value}'
                        }
                    },
                    {
                        type: 'value',
                        position: 'right',
                        name: '仓位比',
                        axisLabel: {
                            formatter: '{value}'
                        }
                    },
                    {
                        type: 'value',
                        position: 'right',
                        name: '持仓量',
                        show:false,
                        axisLabel: {
                            formatter: '{value}'
                        },
                        // 如果需要对右侧Y轴进行特定的配置，比如反向坐标轴
                        //inverse: true
                    },
                    {
                        type: 'value',
                        position: 'left',
                        name: '股价变化',
                        show:false,
                        axisLabel: {
                            formatter: '{value}'
                        }
                    }
                ]
            };
            $.me.clickQuery();
            $.me.netChart(false);
            $.me.init_date_picker();
            $.me.initDatePicker();

            if (params['stk_id'] &&
                params['stk_id'].length == '8' &&
                ['SH','SZ','sh','sz'].indexOf(params['stk_id'].substr(0,2)) != -1 &&
                /^\d{6}$/.test(params['stk_id'].substr(2))
            ) {
                $.me.stk_id     =   params['stk_id'];
                var stockid     =   params['stk_id'].substr(2);
                $("#stockidname").val(stockid).trigger('input');
            }
        },
        //净值图
        netChart:function(state){
            $('.deal_div span').html('-');
            if($.cookie('begin-date') != null){
                $('#begin-date').val($.cookie('begin-date'));
            }
            if($.cookie('end-date') != null){
                $('#end-date').val($.cookie('end-date'));
            }
            if(state){
                var objdata         =   $.me.requestData;
                if($.me.table){
                    objdata.table   =   $.me.table;
                }
                objdata.sid         =   $.me.sid;
                $.ajax({
                    type: "post",
                    async: false,
                    dataType: "json",
                    url: $.me.url,
                    data: objdata,
                    success: function (data) {
                        if (data.success) {
                            if(data.data.auth.indexOf(parseInt(data.mid)) > -1){
                                $('.dk-cls-test').show();
                            }
                            if(data.data.deals.length>0){
                                $('#flag').html(data.flag);
                                var deals_info = data.data.deals.split('##');
                                $('.deal_div ._jybs').html(deals_info[0]);//交易笔数
                                $('.deal_div ._sfp').html(deals_info[1]);//胜/负/平
                                $('.deal_div ._zd').html(deals_info[2]);//最大
                                $('.deal_div ._zx').html(deals_info[3]);//最小
                                $('.deal_div ._zyl').html(deals_info[4]);//总盈利
                                $('.deal_div ._jyk').html(deals_info[5]);//均盈/均亏
                                $('.deal_div ._ykb').html(deals_info[6]);//盈亏比
                                $('.deal_div ._qwz').html(deals_info[7]);//期望值
                                $('.deal_div ._gjbh').html(deals_info[8]);//股价变化

                                //均盈
                                var win_lose            =   deals_info[5].split('/');
                                var win_ava_per         =   parseFloat(win_lose[0]);
                                //均亏
                                var lose_ava_per        =   parseFloat(win_lose[1]);
                                //平
                                var draw_ava_per        =   0;
                                //胜/负/平 比率
                                var pers                =   deals_info[9].split('/');
                                var win_per             =   parseFloat(pers[0]);
                                var lose_per            =   parseFloat(pers[1]);
                                var draw_per            =   parseFloat(pers[2]);
                                var con_per             =   Math.round((win_ava_per*win_per + lose_ava_per*lose_per + draw_ava_per*draw_per)*1000)/1000+'%';
                                $('.deal_div ._bcjyyl').html(con_per);//百次交易盈利
                            }
                            $.me.reason =  data.data.reason;

                            //清理缓存 - 重置表单
                            var myChart = echarts.init(document.getElementById('stockbigk'));
                            $.me.options.dataZoomStart              =   80;
                            $.me.option1.dataZoom[0].start          =   80;
                            $.me.option1.dataZoom[1].start          =   80;
                            $.me.option1.series[1].data             =   [];
                            $.me.option1.series[2].data             =   [];
                            $.me.option1.series[3].data             =   [];
                            $.me.option1.series[4].data             =   [];
                            $.me.option1.series[5].data             =   [];
                            $.me.option1.series[6].data             =   [];
                            $.me.option1.series[7].data             =   [];
                            $.me.option1.series[8].data             =   [];
                            $.me.option1.xAxis.data                 =   null;
                            $.me.option1.series[0].name             =   'K线';
                            $.me.option1.series[0].data             =   null;
                            $.me.option1.series[0].markLine.data    =   null;
                            $.me.option1.series[0].markArea.data    =   null;
                            $.me.option1.series[1].markLine.data    =   [];
                            myChart.setOption($.me.option1,true);
                            myChart.clear();

                            var myChart2 = echarts.init(document.getElementById('stockbigk-bar'));
                            $.me.option2.dataZoom[0].start          =   80;
                            $.me.option2.dataZoom[1].start          =   80;
                            $.me.option2.xAxis.data                 =   null;
                            $.me.option2.series[0].data             =   null;
                            $.me.option2.series[0].name             =   '净值';
                            $.me.option2.series[1].data             =   null;
                            $.me.option2.series[1].name             =   '仓位比';
                            $.me.option2.series[2].data             =   null;
                            $.me.option2.series[2].name             =   '持仓量';
                            $.me.option2.series[3].data             =   null;
                            $.me.option2.series[3].name             =   '股价变化';
                            myChart2.setOption($.me.option2,true);
                            myChart2.clear();

                            if(data.data.zooms){
                                $.me.options.dataZoomStart        =     data.data.zooms;
                                $.me.option1.dataZoom[0].start    =     data.data.zooms;
                                $.me.option1.dataZoom[1].start    =     data.data.zooms;
                                $.me.option2.dataZoom[0].start    =     data.data.zooms;
                                $.me.option2.dataZoom[1].start    =     data.data.zooms;
                                $.me.option2.dataZoom[2].start    =     data.data.zooms;
                                $.me.option2.dataZoom[3].start    =     data.data.zooms;
                            }
                            //净值数据
                            $.me.option2.xAxis.data       =     data.data.kdate?data.data.kdate:null;
                            $.me.option2.series[0].data   =     data.data.kdata?data.data.kdata:null;
                            $.me.option2.series[1].data   =     data.data.kdata1?data.data.kdata1:null;
                            $.me.option2.series[2].data   =     data.data.kdata2?data.data.kdata2:null;
                            $.me.option2.series[3].data   =     data.data.kdata3?data.data.kdata3:null;
                            $.me.option2.series[0].name   =     data.data.name;

                            //K线数据
                            $.me.option1.xAxis.data                 =   (data.data.kline && data.data.kline.kline_x)?data.data.kline.kline_x:null;
                            $.me.option1.series[0].name             =   data.data.name;
                            $.me.option1.series[0].data             =   (data.data.kline && data.data.kline.kline)?data.data.kline.kline:null;
                            $.me.option1.series[0].markLine.data    =   (data.data.kline && data.data.kline.kline_bi)?data.data.kline.kline_bi1.concat(data.data.kline.kline_bi):null;
                            $.me.option1.series[0].markArea.data    =   (data.data.kline && data.data.kline.kline_zs)?data.data.kline.kline_zs:null;

                            //三角 - 多空头信息
                            $.me.option1.series[1].data             =   data.data.sb[0];
                            $.me.option1.series[2].data             =   data.data.sb[1];
                            $.me.option1.series[3].data             =   data.data.sb[2];
                            $.me.option1.series[4].data             =   data.data.sb[3];
                            $.me.option1.series[5].data             =   data.data.sb[4];
                            $.me.option1.series[6].data             =   data.data.sb[5];
                            $.me.option1.series[7].data             =   data.data.sb[6];
                            $.me.option1.series[8].data             =   data.data.sb[7];

                            $.me.options.chars[0] = echarts.init(document.getElementById('stockbigk'));
                            $.me.options.chars[1] = echarts.init(document.getElementById('stockbigk-bar'));
                            $.me.options.chars[0].setOption($.me.option1);
                            $.me.options.chars[1].setOption($.me.option2);
                            $.me.options.chars[0].group = 'group1';
                            $.me.options.chars[1].group = 'group1';
                            echarts.connect('group1');
                        } else {
                            $.me.showMsgAlert(data.reason);
                        }
                    }
                });
            }else{
                $.me.option2.xAxis.data={};
                $.me.option2.series[0].data = [];
                $.me.option2.series[1].data = [];
                $.me.option2.series[2].data = [];
                $.me.option2.series[3].data = [];

                //K线数据
                $.me.option1.xAxis.data                 = null;
                $.me.option1.series[0].data             = null;
                $.me.option1.series[0].markLine.data    = null;
                $.me.option1.series[0].markArea.data    = null;
                $.me.options.chars[0] = echarts.init(document.getElementById('stockbigk'));
                $.me.options.chars[1] = echarts.init(document.getElementById('stockbigk-bar'));
                $.me.options.chars[0].setOption($.me.option1);
                $.me.options.chars[1].setOption($.me.option2);
                $.me.options.chars[0].group = 'group1';
                $.me.options.chars[1].group = 'group1';
                echarts.connect('group1');
            }
        },
    }
})(jQuery);
