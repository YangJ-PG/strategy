<?php
/*
 *  净值分析
*/
//require_once dirname(dirname(dirname(__FILE__)))."/init.php";
require_once dirname(dirname(__FILE__))."/commonCheckSid.php";

if(!isset($_REQUEST['stockid']) || empty($_REQUEST['stockid'])){
    die(json_encode(array('success' => false, 'reason'=>'股票代码必选')));
}else{
    if (!preg_match("/^\d{6}$/", $_REQUEST['stockid'])) {
        die(json_encode(array('success' => false, 'reason'=>'股票代码有误')));
    }
}
if (!isset($_REQUEST['market']) || empty($_REQUEST['market'])) {
    die(json_encode(array('success' => false, 'reason'=>'market类型有误')));
}else{
    $_REQUEST['market']     =   strtoupper($_REQUEST['market']);
    if (!in_array($_REQUEST['market'],['SH','SZ'])) {
        die(json_encode(array('success' => false, 'reason'=>'market类型有误')));
    }
}
if(!isset($_REQUEST['dataType']) || empty($_REQUEST['dataType'])){
    die(json_encode(array('success' => false, 'reason'=>'数据类型必选')));
}else{
    if(!in_array($_REQUEST['dataType'],['page','list'])){
        die(json_encode(array('success' => false, 'reason'=>'数据类型有误')));
    }
}
$tablearr                   =   [1=>["st_dkt",'多空策略激进型'], 2=>["st_dkt_wj",'多空策略稳健型'], 3=>["v_st_dkt_test",'多空策略测试'], 4=>["v_st_dkt_test2",'多空策略测试2']];
$table_name                 =   !isset($_REQUEST['table'])?'st_dkt':$tablearr[$_REQUEST['table']][0];
$flag                       =   !isset($_REQUEST['table'])?'多空策略激进型':$tablearr[$_REQUEST['table']][1];
$dataType                   =   $_REQUEST['dataType'];
$market                     =   $_REQUEST['market'];
$stockid                    =   $_REQUEST['stockid'];
$stkid                      =   ($market == 'SH')?'1'.$stockid:'2'.$stockid;
if (
    substr($stockid,0, 1) == '5' ||
    in_array(substr($stockid,0, 2),['11','13']) ||
    $stockid == "000043"
){
    $market     =   'SH';
    $stkid      =   '1'.$stockid;
}else if(substr($stockid,0, 3) == '399'){
    $market     =   'SZ';
    $stkid      =   '2'.$stockid;
}else if(substr($stockid,0, 1) == '8'){
    $market     =   'SH';
    $stkid      =   '3'.$stockid;
}

$table_suffix               =   $where_suffix   =   '';
if(isset($_COOKIE['begin-date']) && !empty($_COOKIE['begin-date'])){
    $where_suffix           .=  " and dkt.t_date>='".$_COOKIE['begin-date']." 00:00:00'";
}
if(isset($_COOKIE['end-date']) && !empty($_COOKIE['end-date'])){
    $where_suffix           .=  " and dkt.t_date<='".$_COOKIE['end-date']." 23:59:59'";
}
$authArr = [23,10637,12,36];

//净值数据
$stockModel =   new \model\JrjyStockModel();
$sql        =   "Select 
                      `t_date`,
                      `bs_type`,
                      `ex_price`,
                      `sl_price1`,
                      case when $mid = 23 then `reason` else null end reason,
                      `volume`,
                      `trade_amount`,
                      `ref_amount`,
                      `cost`,
                      `win`,
                      `vol_remain`,
                      `avg_price`,
                      `order_type`,
                      `win_percent`,
                      `net`,
                      `net` as `net_num`,
                      round(vol_remain*avg_price/net,3) as `cwb`,
                      case 
                          when `order_type` = 1 then concat(`ex_price`,'买(首)',`volume`) 
                          when `order_type` = 2 then concat(`ex_price`,'买(加)',`volume`) 
                          when `order_type` = 3 then concat(`ex_price`,'卖(减)',`volume`) 
                          else concat(`ex_price`,'卖(清)',`volume`) end remark
                from $table_name dkt $table_suffix
                Where dkt.stk_id='$stkid' $where_suffix";

$sql       .=   "order by t_date asc";
$data       =   $stockModel->query52Stock($sql);

$returnData                         =   array();
if($dataType == 'list'){
    $returnData['kline']            =   [];
    $returnData['line']             =   [];
    $returnData['sb']               =   [[],[],[],[],[],[],[],[]];
    $returnData['zooms']            =   null;
    $returnData['kdate']            =   [];
    $returnData['kdata']            =   [];
    $returnData['kdata2']           =   [];
    $returnData['deals']            =   [];
    $returnData['name']             =   (isset($_REQUEST['stockname']) && !empty($_REQUEST['stockname']))?$_REQUEST['stockname']:null;
}else{
    $returnData['aaData']           =   [];
    $returnData['iTotalRecords']    =   $returnData['iTotalDisplayRecords'] = 0;
}
if($dataType == 'list'){
     $_date    = !empty($data)?date('Ymd',strtotime($data[0]->t_date)):date('Ymd');
    // k线数据
    $klineData = util\Tool::curl("http://127.0.0.1/webphp/hchan/jzfx/getwebstock.php?stockid=$stockid&market=$market&num=500&start=-500&date=$_date");
    $klineData = @json_decode($klineData, true);
    if(!empty($klineData) && $klineData['success'] && !empty($klineData['data'])){
        $returnData['kline'] = $klineData['data'];
        unset($klineData);
    }
}
if(!empty($data)){
    $data       =   json_decode(json_encode($data),true);
    $first_amount = $data[0]['ref_amount'];
    array_walk($data,function(&$value,$key) use($first_amount){
        if($key == 0){
            $value['net']   =   sprintf("%.3f",0);
        }else{
            $value['net']   =   sprintf("%.3f",round(($value['net']-$first_amount)/$first_amount,3));
        }
    });
    if($dataType == 'list'){
        if(!empty($returnData['kline'])){
            //中枢、笔、线段 暂时不展示
            $returnData['kline']['kline_bi']      =   [];
            $returnData['kline']['kline_bi1']     =   [];
            $returnData['kline']['kline_zs']      =   [];
            $returnData['kline']['kline_zs1']     =   [];
            //k线时间轴
            $kline_x                              =   array_values($returnData['kline']['kline_x']);

            //净值 - 时间(相同时间取一)对应净值
            $s = array_combine(array_values(
                array_map(function($value){
                    return str_replace('-','',substr($value['t_date'],0,10));
                },$data)
            ),array_values(
                array_map(function($value) use($returnData,$first_amount,$_date){
                    $net                =   $value['net'];
                    $_vol_remain        =   $value['vol_remain'];
                    $_avg_price         =   $value['avg_price'];
                    if((int)$value['vol_remain']>0){//最后的买卖单有剩余股票时
                        $_d              =   str_replace('-','',substr($value['t_date'],0,10));
                        $_key               =   array_keys($returnData['kline']['kline_x'],$_d)[0];
                        $_closeprice        =   $returnData['kline']['kline'][$_key][1];
                        $_fd                =   ($_vol_remain*($_closeprice-$_avg_price)/$first_amount);
                        $net                =   round($net+$_fd,3);
                        if($_d == $_date){
                            $net = sprintf("%.3f",0);
                        }
                    }
                    return $net.'_'.$_vol_remain.'_'.$_avg_price.'_'.$value['net'];
                },$data)
            ));
            //净值图数据 - 净值
            $lastnum = [];
            $kdatas['data']         =   array_map(function($date) use($s,&$lastnum,$returnData,$first_amount) {
                                                if(isset($s[$date])){
                                                    $datas                  =   explode('_',$s[$date]);
                                                    $num                    =   $datas[0];
                                                    $lastnum['vol_remain']  =   $datas[1];
                                                    $lastnum['avg_price']   =   $datas[2];
                                                    $lastnum['net']         =   $datas[3];
                                                    return $num;
                                                }elseif(isset($lastnum['net'])){
                                                    $net                    =   $lastnum['net'];
                                                    $_vol_remain            =   $lastnum['vol_remain'];
                                                    $_avg_price             =   $lastnum['avg_price'];
                                                    if((int)$_vol_remain>0){//上一笔买卖单有剩余股票时
                                                        $_key                   =   array_keys($returnData['kline']['kline_x'],$date)[0];
                                                        $_closeprice            =   $returnData['kline']['kline'][$_key][1];
                                                        $_fd                    =   ($_vol_remain*($_closeprice-$_avg_price)/$first_amount);
                                                        $net                    =   round($net+$_fd,3);
                                                    }
                                                    return $net;
                                                }
                                                return null;
                                        },$kline_x);

            //净值 - 时间(相同时间取一)对应仓位
            $s = array_combine(array_values(
                array_map(function($value){
                    return str_replace('-','',substr($value['t_date'],0,10));
                },$data)
            ),array_values(
                array_map(function($value){
                    return $value['cwb'];
                },$data)
            ));
            //净值图数据 - 仓位比
            $lastnum = null;
            $kdatas['data1']         =   array_map(function($date) use($s,&$lastnum) {
                                            if(isset($s[$date])){
                                                $num = $s[$date];
                                                $lastnum = $num;
                                                return $num;
                                            }elseif($lastnum>=0){
                                                return $lastnum;
                                            }
                                            return null;
                                        },$kline_x);

            //净值 - 时间(相同时间取一)对应持仓
            $s = array_combine(array_values(
                array_map(function($value){
                    return str_replace('-','',substr($value['t_date'],0,10));
                },$data)
            ),array_values(
                array_map(function($value){
                    return $value['vol_remain'];
                },$data)
            ));
            //净值图数据 - 持仓量
            $lastnum = null;
            $kdatas['data2']         =   array_map(function($date) use($s,&$lastnum) {
                                            if(isset($s[$date])){
                                                $num = $s[$date];
                                                $lastnum = $num;
                                                return $num;
                                            }elseif($lastnum>=0){
                                                return $lastnum;
                                            }
                                            return null;
                                        },$kline_x);
            //净值图数据 - 时间轴
            $kdatas['date']         =   $kline_x;
            unset($s);

            //交易描述
            $reason = array_combine(array_values(
                array_map(function($value){
                    return str_replace('-','',substr($value['t_date'],0,10));
                },$data)
            ),array_values(
                array_map(function($value){
                    return $value['reason'];
                },$data)
            ));

            //净值图数据 - 股价变化
            $kdatas['data3'] = [];
            foreach($returnData['kline']['kline_x'] as $_k=>$_d){
                if($_d >= $_date){
                    if($_d == $_date){
                        array_push($kdatas['data3'],sprintf("%.3f",0));
                    }else{
                        array_push($kdatas['data3'],sprintf("%.3f",round(($returnData['kline']['kline'][$_k][1] - $data[0]['ex_price'])/$data[0]['ex_price'],3)));
                    }
                }else{
                    array_push($kdatas['data3'],null);
                }
            }

            //三角坐标(多：三角红 / 空：三角绿 / 平：倒三角 / 开 ：正三角)
            $triangle_dates = [[],[],[],[]];//部分平,全平,首开,加开
            $triangle_datas = [[],[],[],[],[],[],[],[]];//三角数据：部分平,部分平 重合时间,全平,全平 重合时间,首开,首开 重合时间,加开,加开 重合时间
            foreach($data as $val){
                //多空状态值
                $bs_type         =   (int)$val['bs_type'];
                $order_type      =   (int)$val['order_type'];
                $remark          =   $val['remark'];
                //价格
                $ex_price       =   $val['ex_price'];
                //时间
                $t_date         =   $val['t_date']?str_replace('-','',substr($val['t_date'],0,10)):null;
                //平仓信息
                if($bs_type<0){
                    if($order_type == 3){//部分平
                        if(!in_array($t_date,$triangle_dates[0])){
                            array_push($triangle_datas[0],[$t_date,$ex_price,$remark]);//部分平
                            array_push($triangle_dates[0],$t_date);
                        }else{
                            array_push($triangle_datas[1],[$t_date,$ex_price,$remark]);//部分平 重合时间
                        }
                    }else{//全平
                        if(!in_array($t_date,$triangle_dates[1])){
                            array_push($triangle_datas[2],[$t_date,$ex_price,$remark]);//全平
                            array_push($triangle_dates[1],$t_date);
                        }else{
                            array_push($triangle_datas[3],[$t_date,$ex_price,$remark]);//全平 重合时间
                        }
                    }
                }

                //开仓信息
                if($bs_type>0){
                    if($order_type == 1) {//首开
                        if(!in_array($t_date,$triangle_dates[2])){
                            array_push($triangle_datas[4],[$t_date,$ex_price,$remark]);//首开
                            array_push($triangle_dates[2],$t_date);
                        }else{
                            array_push($triangle_datas[5],[$t_date,$ex_price,$remark]);//首开 重合时间
                        }
                    }else{//加开
                        if(!in_array($t_date,$triangle_dates[3])){
                            array_push($triangle_datas[6],[$t_date,$ex_price,$remark]);//加开
                            array_push($triangle_dates[3],$t_date);
                        }else{
                            array_push($triangle_datas[7],[$t_date,$ex_price,$remark]);//加开 重合时间
                        }
                    }
                }
            }
            //dataZoomStart
            $zooms                  =   ((int)array_search(str_replace('-','',substr($data[0]['t_date'],0,10)),$kline_x)+1)/count($kline_x)*100;

            //净值数据 - 时间轴
            $returnData['kdate']    =   $kdatas['date'];
            //净值数据 - 净值
            $returnData['kdata']    =   $kdatas['data'];
            //净值图数据 - 仓位比
            $returnData['kdata1']   =   $kdatas['data1'];
            //净值图数据 - 持仓量
            $returnData['kdata2']   =   $kdatas['data2'];
            //净值图数据 - 股价变化
            $returnData['kdata3']   =   $kdatas['data3'];
            //K线 - 三角数据
            $returnData['sb']       =   $triangle_datas;
            //dataZoomStart
            $returnData['zooms']    =   $zooms;
            //交易描述
            $returnData['reason']   =   $reason;
            unset($kline_x,$kdatas,$triangle_datas);
        }

        $datas     =   array_filter($data,function($item){
                            return $item['bs_type'] < 0;
                        });
        $p_inc      =   array_map(function($value){ return $value['win_percent'];},$datas);
        unset($datas);
        $win_arr    =   [];
        $lose_arr   =   [];
        $draw_num   =   0;
        foreach($p_inc as $val){
            if($val>0){
                array_push($win_arr,$val);
            }elseif($val<0){
                array_push($lose_arr,$val);
            }else{
                $draw_num++;
            }
        }
        //交易笔数
        $net_count   =   count($p_inc);

        //买/卖
        $bs_count       = (count($data)-$net_count).'/'.$net_count;

        //交易胜笔数
        $win_num        =   count($win_arr);
        //最大
        $win_max        =   sprintf("%.2f",round(max($win_arr)*100,2)).'%';
        //胜率
        $win_rate       =   sprintf("%.2f",round($win_num/$net_count*100,2)).'%';
        //均盈
        $ava_win_rate   =   $win_num == 0?'0.00%':sprintf("%.2f",round(array_sum($win_arr)/$win_num*100,2)).'%';

        //交易亏笔数
        $lose_num       =   count($lose_arr);
        //最小
        $lose_min       =   sprintf("%.2f",round(min($lose_arr)*100,2)).'%';
        //亏率
        $lose_rate      =   sprintf("%.2f",round($lose_num/$net_count*100,2)).'%';
        //均亏
        $ava_lose_rate  =   $lose_num == 0?"0.00%":sprintf("%.2f",round(array_sum($lose_arr)/$lose_num*100,2)).'%';

        //均盈/均亏
        $ava_win_lose   =   $ava_win_rate.'/'.$ava_lose_rate;

        //平率
        $draw_rate      =   sprintf("%.2f",round(100 - (float)$win_rate - (float)$lose_rate,2)).'%';

        //胜负平
        $win_lose_per        =   $win_rate.'/'.$lose_rate.'/'.$draw_rate;
        $win_lose_num        =   $win_num.'/'.$lose_num.'<i style=\'color: #ADADAD;\'>('.$win_rate.'/'.$lose_rate.')</i>';

        //盈亏比
        $win_lose_rate_num  =   (float)$ava_lose_rate == 0 ? "0.000": sprintf("%.3f",abs(round((float)$ava_win_rate/(float)$ava_lose_rate,3)));
        $win_lose_rate      =   $win_lose_rate_num.' : 1';

        //总盈利=结算盈利＋浮动盈利
        //浮动盈利=最后买卖单中的vol_remain剩余数量*(最后收盘价-最后买卖单中平均成本价)
        $lastcloseprice     =   0;
        if(!empty($returnData['kline'])){
            if(isset($_COOKIE['end-date']) && !empty($_COOKIE['end-date'])){
                $lastkey        =   array_keys($returnData['kline']['kline_x'],str_replace('-','',substr($_COOKIE['end-date'],0,10)))[0];
                $lastcloseprice =   $returnData['kline']['kline'][$lastkey][1];
            }else{
                $lastcloseprice =   end($returnData['kline']['kline'])[1];
            }
        }

        $fd_win             =   $data[count($data)-1]['vol_remain']*($lastcloseprice-$data[count($data)-1]['avg_price']);
        $count_win          =   $data[count($data)-1]['net_num']+$fd_win;
        $count_win_pre      =   sprintf("%.2f",round((($count_win-$first_amount)/$first_amount)*100,2)).'%';
        $fd_win_pre         =   sprintf("%.2f",round(($fd_win/$first_amount)*100,2)).'%';
        $count_fd_str       =   $count_win_pre.'/'.$fd_win_pre;

        //期望值 = 胜率*盈亏比-(1-胜率)
        $expect_num         =   sprintf("%.3f",round(((float)$win_rate/100)*$win_lose_rate_num-(1-((float)$win_rate/100)),3));

        //股价变化 - (最后K线收盘 - 第一笔单价)/第一笔单价
        $price_change       =   sprintf("%.2f",(round(($lastcloseprice - $data[0]['ex_price'])/$data[0]['ex_price'],4)*100)).'%';

        $returnData['deals']            =   $bs_count.'##'.
                                            $win_lose_num.'##'.
                                            $win_max.'##'.
                                            $lose_min.'##'.
                                            $count_fd_str.'##'.
                                            $ava_win_lose.'##'.
                                            $win_lose_rate.'##'.
                                            $expect_num.'##'.
                                            $price_change.'##'.
                                            $win_lose_per;


        $returnData['auth']     =   $authArr;
    }else{
        $begin      =   !isset($_REQUEST['iDisplayStart'])?0:$_REQUEST['iDisplayStart'];//起始记录
        $length     =   !isset($_REQUEST['iDisplayLength'])?30:$_REQUEST['iDisplayLength'];;//单页显示数量
        $sort_key   =   't_date';
        $sort_type  =   'asc';
        if(isset($_REQUEST['sSorts']) && !empty($_REQUEST['sSorts'])){
            $sSort_arr  =   explode(',',$_REQUEST['sSorts']);
            $sort_key   =   $sSort_arr[0];
            $sort_type  =   $sSort_arr[1];
        }
        $SORT       =   ($sort_type == 'desc')?SORT_DESC:SORT_ASC;
        array_multisort(
            array_column($data, $sort_key), $SORT,
            $data
        );
        $returnData['aaData']           =   array_slice($data,$begin,$length);
        $returnData['iTotalRecords']    =   $returnData['iTotalDisplayRecords'] = count($data);
    }
}
echo json_encode(array('success' => true, 'flag'=> $flag,'data' =>$returnData,'mid'=>$mid));
