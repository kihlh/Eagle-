// ==UserScript==
// @name                Eagle淘宝工具箱
// @description         一键发送商品主图,详情页,SKU,长图,主图视频到Eagle软件中，方便数据收集和分析，支持一键查看手机端详情页
// @author              黄逗酱酱
// @match               *://chaoshi.detail.tmall.com/*
// @match               https://detail.1688.com/offer/*
// @match               *://item.taobao.com/*
// @match               *://detail.tmall.com/*
// @match               *://h5.m.taobao.com*
// @match               *://detail.m.tmall.com*
// @note                2020-01-24 UI化脚本增加更加稳定的功能，模块化发送的图片支持归类文件夹
// @grant               GM_xmlhttpRequest
// @grant               GM_setClipboard
// @connect             *
// @run-at              document-body
// @require             https://cdn.jsdelivr.net/npm/notyf@3/notyf.min.js
// @require             https://cdn.bootcdn.net/ajax/libs/keypress/2.1.5/keypress.min.js
// @date                01/24/2021
// @version             2.0
// @license             MPL-2.0
// @namespace           https://greasyfork.org/users/710095
// ==/UserScript==

/***************************************************************************************************************************\
 *                                                功能版权声明
 * UI交互界面源码参考自@头号否 https://greasyfork.org/users/39238  许可协议GPL-3.0-only本脚本变更许可协议MPL-2.0
 * Eagle功能开发和参考来自于@Eagle软件开发者  许可协议GPL-3.0-only本脚本变更许可协议MPL-2.0
 * 用户许可协议：只作为对商品的查看作用商品详细增强，不得用于其他用途
 * 主图视频解析参考于@Fatkun图片批量下载 感谢此优秀的软件
 * Eagle接口处理函数来自于用户 @miracleXL https://greasyfork.org/zh-CN/scripts/419792 的优秀封装
 *
 *                                                    待完成
 * --------------------------------------------------------------------------------------------------------------------------
 * 还有几个端还没写 天猫后台淘宝后台
 * 以后支持花瓣自动下载批量收集
 * 懒加载的网站专门细写加载功能
 * 如果发现url为空或者不是//...[.](...)的话删除防止Eagle崩溃
 *
 * // @match               *://m.1688.com* 大部分功能不支持，下架
 * *****在编************
// @match               *://sell.publish.tmall.com*
// @match               *://ipublish.tmall.com*
// @match               *item.upload.taobao.com*
*
/****************************************************************************************************************************/


// Eagle API 服务器位置
(function () {
   'use strict';
   const EAGLE_SERVER_URL = "http://localhost:41595";
   const EAGLE_IMPORT_API_URL = `${EAGLE_SERVER_URL}/api/item/addFromURL`;
   const EAGLE_IMPORT_API_URLS = `${EAGLE_SERVER_URL}/api/item/addFromURLs`;
   const EAGLE_CREATE_FOLDER_API_URL = `${EAGLE_SERVER_URL}/api/folder/create`;
   const EAGLE_GET_FOLDERS_API_URL = `${EAGLE_SERVER_URL}/api/folder/list`;
   let startTime = Date.now(); // 时间戳 主图时间戳是 %*1+(i*0.1)   详情时间戳是 %*1+(i*0.3)   SKU时间戳是%*1+(i*0.2)
   let tb_ID = '';
   let hot_name = window.location.hostname;
   let lazyload =0;
   let fold = "";
   // 判断当前网页类型
   let tb, tm, cs, m_tm, m_tb, tmm, tmup, tbup, _1688, m1688 = 0;
   (function ifhot() {
      if (hot_name === "detail.tmall.com") {
         tm = 1
      } else if (hot_name === "chaoshi.detail.tmall.com") {
         cs = 1
      } else if (hot_name === "item.taobao.com") {
         tb = 1
      } else if (hot_name === "detail.m.tmall.com") {
         m_tm = 1
      } else if (hot_name === "h5.m.taobao.com") {
         m_tb = 1
      } else if (hot_name === "detail.1688.com") {
         _1688 = 1
      } else if (hot_name === "m.1688.com") {
         m1688 = 1
      } else if (hot_name === "ipublish.tmall.com") {
         tmm = 1
      } else if (hot_name === "sell.publish.tmall.com") {
         tmup = 1
      } else if (hot_name === "item.upload.taobao.com") {
         tbup = 1
      }
   })();
   //获取最短链接
   function tb_url() {
      let id = 0;
      let i = document.URL;
      if (i.match(/[\?&]id=(\d{9,13})/)) {
         id = i.match(/[\?&]id=(\d{9,13})/)[1]
      }else if(i.match(/\/offer\/(\d+)[.]html/)){
         id = i.match(/\/offer\/(\d+)[.]html/)[1]
      }
      if ((tm + m_tm) === 1) {
         i = `https://detail.tmall.com/item.htm?id=${id}`
      } else if ((tb + m_tb) === 1) {
         i = `https://item.taobao.com/item.htm?id=${id}`
      } else if (cs === 1) {
         i = `https://chaoshi.detail.tmall.com/item.htm?id=${id}`
      }  else if(_1688===1){
         i= `https://detail.1688.com/offer/${id}.html`
      }  else if(m1688===1){
         i= `https://m.1688.com/offer/${id}.html`
      }else{
         i = `https://detail.tmall.com/item.htm?id=${id}`
      }
      tb_ID = id;
      if (tb_ID === 0) {
         tb_ID = ""
      }
      return i;
   }

// 监听快捷键事件：
let listener = new window.keypress.Listener();
listener.simple_combo("shift s", function() {
   btn_ALL()

      });

   function btn_ALL() {
      getFolderId(title()).then(function (i){
        fold=i;
      let arr =[zhutu,Details,SKU,Video,Details_Video];
      // let arr =[zhutu]
        HM_goArr(arr)
      })
   }
   function btn_SKU() {
      getFolderId(title()).then(function (i){
         fold=i;
       let arr =[SKU];
         HM_goArr(arr)
       })
   }
   function  btn_Details() {
      getFolderId(title()).then(function (i){
         fold=i;
       let arr =[Details,Details_Video];
         HM_goArr(arr)
       })
   }
   function btn_zhutu() {
      getFolderId(title()).then(function (i){
         fold=i;
       let arr =[zhutu];
         HM_goArr(arr)
       })
   }
   function btn_HM_Video() {
      getFolderId(title()).then(function (i){
         fold=i;
       let arr =[Video,Details_Video];
         HM_goArr(arr)
       })
   }
   function btn_HM_copy() {
      GM_setClipboard(tb_url() );
      Qmsg.info(`已复制内容是:${tb_url()}`)

   }
   function System_setup() {

      Qmsg.info(``)

      Qmsg.info(`您好检查到您是第一次在本网站使用本工具箱\n		现在需要您设置下一些功能`)

   }



   (function () {

      window.layerstart = '<div id = "layer" style = "border-radius:2px;top:0em;left:0;width:32%;height:92%;background-color:#FFFFFF;position:fixed;z-index:9999999999999999999999;display:none;border:1px solid #ffffff;overflow:hidden;padding-bottom:30px;border-radius:10px;">';
      layerstart += '<div style="text-align: right; padding: 15px; border-bottom: 1px solid #F8F8F8; height: 20px;background-color: #1a7cd;"><a class="close" href="javascript:;" id="sdghdshhf">X</a><div style="float: left; font-size: 17px; margin-top: -2px; margin-left: 10px; font-family: sans-serif; color: #333;">无线端详情</div></div>';
      window.layerend = '</div>';

      //让层居中显示
      window.layerCenter = function () {
         let bwidth = window.screen.availWidth;
         let bheight = window.screen.availHeight;
         let layertop = (bheight - 720) / 2;
         let layerleft = (bwidth - 1280) / 2;

         if (layertop <= 70) {
            layertop = "1em";
         }
         else {
            layertop = (layertop - 125) + "px";
         }
         document.getElementById("layer").style.top = "20px";
         document.getElementById("layer").style.left = "35%";
      }
      //创建一个遮罩层
      window.keepout = function () {
         var fade = '<div id = "fade" style = "width:100%;height:100%;background:rgba(0, 0, 0, 0.2);position: fixed;left: 0;top: 0;z-index: 999999999;" onclick = "closelayer()"></div>';
         var div = document.createElement("div");
         div.innerHTML = fade;
         document.body.appendChild(div);
      }

      //显示按钮
      if (tb===1) {
         window.showaliwx = function () {
            var up = layerstart;
            up += '<iframe id="thfou_wx" src = "https://h5.m.taobao.com/awp/core/detail.htm?id=' + tb_ID + '" width="100%" height="100%" frameborder="0"></iframe>';
            up += layerend;
            //$("body").append(up);
            var div = document.createElement("div");
            div.innerHTML = up;
            document.body.appendChild(div);

            //$("#layer").show();
            document.getElementById("layer").style.display = "block";

            //显示遮罩
            keepout();
            //居中显示层
            layerCenter();

            let  isncd= document.getElementById('sdghdshhf');
            isncd.addEventListener('click', closelayer, false);

         }
      }
      else if (tm) {
         window.showaliwx = function () {
            var up = layerstart;
            up += '<iframe id="thfou_wx" src = "https://detail.m.tmall.com/item.htm?id=' + tb_ID + '" width="100%" height="97.5%" frameborder="0"></iframe>';
            up += layerend;
            var div = document.createElement("div");
            div.innerHTML = up;
            document.body.appendChild(div);
            document.getElementById("layer").style.display = "block";
            //显示遮罩
            keepout();
            //居中显示层
            layerCenter();
            let  isncd= document.getElementById('sdghdshhf');
            isncd.addEventListener('click', closelayer, false);

         }
      }else{
         window.showaliwx=function () {}
      }
      var alicmz = '<div id="onii_alicmz"></div>';
      var getbody = document.getElementsByTagName('body')[0];
      getbody.insertAdjacentHTML('afterbegin', alicmz);

      var style = document.createElement('style');
      style.type = 'text/css';
      style.innerHTML = `#onii_alicmz,.aliwx {
         font: 14px "PingFang SC","Lantinghei SC","Microsoft YaHei","HanHei SC","Helvetica Neue","Open Sans",Arial,"Hiragino Sans GB","微软雅黑",STHeiti,"WenQuanYi Micro Hei",SimSun,sans-serif;
         position: fixed;  top: 25%;  right: 50px;  padding: 10px;  min-width: 130px;  text-align: center;  z-index: 999999999999999;  background: #fff;  border-radius: 15px;  border: 1px solid #1a7cda;}
         .alicmzbtn { font: 14px "PingFang SC","Lantinghei SC","Microsoft YaHei","HanHei SC","Helvetica Neue","Open Sans",Arial,"Hiragino Sans GB","微软雅黑",STHeiti,"WenQuanYi Micro Hei",SimSun,sans-serif; background-color: #1a7cda;  color: #ffffff;  border: 0px solid #f0cab6;  right: 20em;  top: 40em;  z-index: 88;  cursor: pointer;  padding: 5px 20px;  border-radius: 50px;  margin-bottom: 10px;  transition: 0.3s;}
         .alicmzbtn2 { font: 14px "PingFang SC","Lantinghei SC","Microsoft YaHei","HanHei SC","Helvetica Neue","Open Sans",Arial,"Hiragino Sans GB","微软雅黑",STHeiti,"WenQuanYi Micro Hei",SimSun,sans-serif; background-color: #e0244bb0;  color: #ffffff;  border: 0px solid #f0cab6;  right: 20em;  top: 40em;  z-index: 88;  cursor: pointer;  padding: 5px 20px;  border-radius: 50px;  margin-bottom: 10px;  transition: 0.3s;}
         .alicmzbtn:hover {  color: #fff;  background-color: #1c8ded;}
         .close {  color: #828282;  background-color: #e6e6e6;  width: 80px;  text-align: center;  padding: 0.5em;  border-radius: 2px;  padding-left: 1em;  padding-right: 1em;  text-decoration: none;  transition: 0.3s;}
         .close:hover {  color: #5d5d5d;  background-color: #ffffff;  text-decoration: none;}
         .alicmzbtn a {  color: #1c8ded;  text-decoration: none;}
         .dmcss a {  color: #d3d3d3;  text-decoration: none;}
         .xflogo {  width: 110px;  padding: 15px 10px 15px 10px;}
         #gbxf {  color: #1c8ded;  position: absolute;  right: 8px;  top: 6px;  font-size: 12px;  cursor: pointer;  transition: 0.3s;  border: 1px #000000 solid;  line-height: 9px;  border-radius: 3px;  padding: 1px;}
         #gbxf:hover {  color: #fff;  border: 1px #fa630a solid;background-color: #fa630a;  opacity: 0.8;}
         #smallxf {  position: fixed;  bottom: 36px;  right: 36px;  color: #fe4514;  background-color: #fff;  border: 2.5px solid #1a7cda;  padding: 8px;  font-weight: bold;  font-size: 14px;  cursor: pointer;  border-radius: 27px;  z-index: 999999999999999999;  transition: 0.6s;}
         #smallxf:hover {  bottom: 5px;  box-shadow: rgba(0, 0, 0, 0.04) 0 1px 5px 0px;}
        .smlogo {  width: 100px;  padding: 2px 5px 0px 5px;}
        .qmsg.qmsg-wrapper { font: 14px "PingFang SC","Lantinghei SC","Microsoft YaHei","HanHei SC","Helvetica Neue","Open Sans",Arial,"Hiragino Sans GB","微软雅黑",STHeiti,"WenQuanYi Micro Hei",SimSun,sans-serif;box-sizing: border-box; margin: 0; padding: 0; color: rgba(0,0,0,.55); font-size: 13px; font-variant: tabular-nums; line-height: 1; list-style: none; font-feature-settings: "tnum"; position: fixed; top: 16px; left: 0; z-index: 999999999999999999999999999; width: 100%; pointer-events: none}
        .qmsg .qmsg-item { padding: 8px; text-align: center; -webkit-animation-duration: .3s; animation-duration: .3s; position: relative}
        .qmsg .qmsg-item .qmsg-count { font: 14px "PingFang SC","Lantinghei SC","Microsoft YaHei","HanHei SC","Helvetica Neue","Open Sans",Arial,"Hiragino Sans GB","微软雅黑",STHeiti,"WenQuanYi Micro Hei",SimSun,sans-serif;text-align: center; position: absolute; left: -4px; top: -4px; background-color: red; color: #fff; font-size: 12px; line-height: 16px; border-radius: 2px; display: inline-block; min-width: 16px; height: 16px; -webkit-animation-duration: .3s; animation-duration: .3s}
        .qmsg .qmsg-item:first-child { margin-top: -8px}
        .qmsg .qmsg-content { text-align: left; position: relative; display: inline-block; padding: 17px 26px; font: 14px "PingFang SC","Lantinghei SC","Microsoft YaHei","HanHei SC","Helvetica Neue","Open Sans",Arial,"Hiragino Sans GB","微软雅黑",STHeiti,"WenQuanYi Micro Hei",SimSun,sans-serif;background: #fff; border-radius: 4px; box-shadow: 0 4px 12px rgba(0,0,0,.15); pointer-events: all; font-weight: 700; font-size: 18px; max-width: 80%; min-width: 80px}
        .qmsg .qmsg-content [class^="qmsg-content-"] { white-space: nowrap; overflow: hidden; text-overflow: ellipsis}
        .qmsg .qmsg-content .qmsg-content-with-close { padding-right: 20px}
        .qmsg .qmsg-icon { display: inline-block; color: inherit; font-style: normal; line-height: 0; text-align: center; text-transform: none; vertical-align: -.125em; text-rendering: optimizeLegibility; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; position: relative; top: 1px; margin-right: 8px; font-size: 16px}
        .qmsg .qmsg-icon svg { display: inline-block}
        .qmsg .qmsg-content-info .qmsg-icon { color: #1890ff; user-select: none}
        .qmsg .qmsg-icon-close { position: absolute; top: 11px; right: 5px; padding: 0; overflow: hidden; font-size: 12px; line-height: 22px; background-color: transparent; border: 0; outline: 0; cursor: pointer; color: rgba(0,0,0,.45); transition: color .3s}
        .qmsg .qmsg-icon-close:hover>svg path { stroke: #555}
        .qmsg .animate-turn { animation: MessageTurn 1s linear infinite; -webkit-animation: MessageTurn 1s linear infinite}
        @keyframes MessageTurn { 0% { -webkit-transform: rotate(0deg) } 25% { -webkit-transform: rotate(90deg) } 50% { -webkit-transform: rotate(180deg) } 75% { -webkit-transform: rotate(270deg) } 100% { -webkit-transform: rotate(360deg) }}
        @-webkit-keyframes MessageTurn { 0% { -webkit-transform: rotate(0deg) } 25% { -webkit-transform: rotate(90deg) } 50% { -webkit-transform: rotate(180deg) } 75% { -webkit-transform: rotate(270deg) } 100% { -webkit-transform: rotate(360deg) }}
        @-webkit-keyframes MessageMoveOut { 0% { max-height: 150px; padding: 8px; opacity: 1 } to { max-height: 0; padding: 0; opacity: 0 }}
        @keyframes MessageMoveOut { 0% { max-height: 150px; padding: 8px; opacity: 1 } to { max-height: 0; padding: 0; opacity: 0 }}
        @-webkit-keyframes MessageMoveIn { 0% { transform: translateY(-100%); transform-origin: 0 0; opacity: 0 } to { transform: translateY(0); transform-origin: 0 0; opacity: 1 }}
        @keyframes MessageMoveIn { 0% { transform: translateY(-100%); transform-origin: 0 0; opacity: 0 } to { transform: translateY(0); transform-origin: 0 0; opacity: 1 }}
        @-webkit-keyframes MessageShake { 0%,100% { transform: translateX(0px); opacity: 1 } 25%,75% { transform: translateX(-4px); opacity: .75 } 50% { transform: translateX(4px); opacity: .25 }}
        @keyframes MessageShake { 0%,100% { transform: translateX(0px); opacity: 1 } 25%,75% { transform: translateX(-4px); opacity: .75 } 50% { transform: translateX(4px); opacity: .25 }}        `
      document.getElementsByTagName('HEAD').item(0).appendChild(style);
      //创建一个显示按钮
      (function () {
         let getkj = document.getElementById("onii_alicmz");
         getkj.innerHTML = `
       <div id="HM_M_TB" class= "alicmzbtn" >查看移动端</div>
        <div id="HM_dowAll" class= "alicmzbtn" >下载全部</div>
         <div id="HM_SKU_GO" class= "alicmzbtn" >下载SKU</div>
          <div id="HM_zhutu" class= "alicmzbtn" >下载主图</div>
            <div id="HM_Details_GO" class= "alicmzbtn" >下载详情</div>
              <div id="HM_Video" class= "alicmzbtn" >下载视频</div>
                <div id="HM_copy" class= "alicmzbtn" >复制短链</div>
                 <div id="HM_AII_ail" class= "alicmzbtn2" >查看菜单</div>
                   <div id="HM_AII_off" class= "alicmzbtn2" >返回菜单</div>
                     <div id="keypress_HM" class= "alicmzbtn2" >网站设置</div>
                       <div id="HM_UPDATES"<a style="text-decoration:none;" target="_blank" href="https://greasyfork.org/zh-CN/scripts/417000"><div class="alicmzbtn">检查更新</div></a></div>
            `;
         document.body.appendChild(getkj);
      })();
      let gbxf = '<div id="gbxf" onclick="hidexf();" title="点击隐藏">—</div>';
      let xfkj = document.getElementById('onii_alicmz');
      xfkj.insertAdjacentHTML('afterbegin', gbxf);

      let hdxf = document.getElementById('gbxf');
      hdxf.addEventListener('click', hidexf, false);

      let  HM_M_TB= document.getElementById('HM_M_TB');
      HM_M_TB.addEventListener('click', showaliwx, false);

      let  HM_dowAll= document.getElementById('HM_dowAll');
      HM_dowAll.addEventListener('click', btn_ALL, false);

      let  HM_SKU_GO= document.getElementById('HM_SKU_GO');
      HM_SKU_GO.addEventListener('click', btn_SKU, false);

      let  HM_zhutu= document.getElementById('HM_zhutu');
      HM_zhutu.addEventListener('click', btn_zhutu, false);

      let  HM_Details_GO= document.getElementById('HM_Details_GO');
      HM_Details_GO.addEventListener('click', btn_Details, false);

      let  HM_Video= document.getElementById('HM_Video');
      HM_Video.addEventListener('click', btn_HM_Video, false);

      let  HM_copy= document.getElementById('HM_copy');
      HM_copy.addEventListener('click', btn_HM_copy, false);

      let  HM_AII_off= document.getElementById('HM_AII_off');
      HM_AII_off.addEventListener('click', btn_HM_AII_off, false);

      let  keypress_HM= document.getElementById('keypress_HM');
      keypress_HM.addEventListener('click', System_setup, false);

      // 按下这个按钮将增加其他按钮以保证其他功能能够正常运行
      let  HM_AII_ail= document.getElementById('HM_AII_ail');
      HM_AII_ail.addEventListener('click', btn_all_ail, false);
      function btn_all_ail() {
         document.querySelector('#HM_AII_ail').style.display="none";
         document.querySelector('#HM_M_TB').style.display="block";
         document.querySelector('#HM_dowAll').style.display="block";
         document.querySelector('#HM_SKU_GO').style.display="block";
         document.querySelector('#HM_zhutu').style.display="block";
         document.querySelector('#HM_Details_GO').style.display="block";
         document.querySelector('#HM_Video').style.display="block";
         document.querySelector('#HM_copy').style.display="block";
         document.querySelector('#HM_AII_off').style.display="block";
          if(cs===1){
          document.querySelector('#HM_SKU_GO').style.display="none";
          }if(document.querySelector('.tb-video video')){}
          else if(document.querySelector('.lib-video video')){}
          else{document.querySelector('#HM_Video').style.display="none";}



      }
      // 如果不是淘宝网或者天猫就把手机端模拟的移除（包含了1688因为网站设置了拦截）默认四个比较美观太多了用户体验不好
      // 默认开启和关闭的开关
      function btn_HM_AII_off() {
         document.querySelector('#HM_AII_ail').style.display="block";
         document.querySelector('#HM_M_TB').style.display="block";
         document.querySelector('#HM_dowAll').style.display="block";
         document.querySelector('#HM_SKU_GO').style.display="block";
         document.querySelector('#HM_zhutu').style.display="none";
         document.querySelector('#HM_Details_GO').style.display="block";
         document.querySelector('#HM_Video').style.display="none";
         document.querySelector('#HM_copy').style.display="none";
         document.querySelector('#HM_AII_off').style.display="none";
         document.querySelector('#HM_UPDATES').style.display="none";

         if(tb===1){document.querySelector('#HM_Details_GO').style.display="none";
      }else if(tm===1){document.querySelector('#HM_Details_GO').style.display="none";
      }else if(cs===1){
         document.querySelector('#HM_zhutu').style.display="block";
         document.querySelector('#HM_M_TB').style.display="none";
         document.querySelector('#HM_Details_GO').style.display="block";
          document.querySelector('#HM_SKU_GO').style.display="none";
      }else{document.querySelector('#HM_M_TB').style.display="none";}

      }btn_HM_AII_off();

     //关闭层
  function closelayer(){
      //$("#layer").hide();
      document.getElementById("layer").style.display = "none";
     //showSidebar();
     //$("#layer").remove();
     var layer = document.getElementById("layer");
     layer.parentNode.removeChild(layer);

     //$("#fade").remove();
     var fade = document.getElementById("fade");
     fade.parentNode.removeChild(fade);
   };


      var smallxf = '<div id="smallxf" style="display:none;"title="点击恢复"><img src="https://kiic.oss-cn-beijing.aliyuncs.com/ico/Eagle_box_icc.svg" class="smlogo"></div>';
      var getcmz = document.getElementById('onii_alicmz');
      getcmz.insertAdjacentHTML('afterend', smallxf);

      var showxf = document.getElementById('smallxf');
      showxf.addEventListener('click', showcmz, false);

      function hidexf() {
         document.getElementById('onii_alicmz').style.display = 'none';
         document.getElementById('smallxf').style.display = 'block';
      };
      function showcmz() {
         document.getElementById('onii_alicmz').style.display = 'block';
         document.getElementById('smallxf').style.display = 'none';
      };



      hidexf();

   })();
//发送模块支持数据函数,因为要模块化和异步等id
   function HM_goArr(arr) {
      if(arr)
      for (let a = 0; a < arr.length; a++) {
         let g = arr[a];
         if(g.name!=="Details"){
            g();
         if(g){go_eagleAll(g())}}
         // 解决详情页懒加载问题
         if(g.name==="Details"){
           scroAll();
           setTimeout( function(){go_eagleAll(g())},1200);}
      }
   }
   // 网站是哪个？如果是数值定为1

   //发送
   function go_eagle(data) {
      GM_xmlhttpRequest({
         url: EAGLE_IMPORT_API_URL,
         method: "POST",
         data: JSON.stringify(data),
         onload: function (response) {
            if (response.statusText !== "OK") {
               console.log(response);
               alert("下载失败！")
            }
         }
      });
   }
   function go_eagleAll(items) {
      let newarr =[];
      let data ={"items":newarr,"folderId":fold}
      if(items.items){
         let arr =items.items;
         for (let s = 0; s < arr.length; s++) {
            let ari = arr[s];
            if(typeof(ari.url)==="string"){
               if(ari.url.match(/.+?\/.+[.](jpe?g|jpg|gif|wepb|png|svg|mp\d|avi|flv|rm|pdf|ai)/i)){
               newarr.push(ari)
            } }
         }
      }
      GM_xmlhttpRequest({
         url: EAGLE_IMPORT_API_URLS,
         method: "POST",
         data: JSON.stringify(data),
         onload: function (response) {
            if (response.statusText !== "OK") {
               alert("请检查eagle是否打开！");
               console.log("下载失败！")
            }
         }
      });
   }
   // 获取文件夹id实际上他会直接创建文件夹
   async function getFolderId(Folder_name) {
      let folders = await getFolders();
      let dlFolder;
      if (folders) {
         for (let folder of folders) {
            if (folder.name === Folder_name) {
               dlFolder = folder;
            }
         }
         if (dlFolder === undefined) dlFolder = await creatFolder(Folder_name);
      }
      else {
         console.log("获取文件夹信息失败！");
         alert("下载失败！");
         return;
      }
      return dlFolder.id;
   }
   // 获取文件夹
   function getFolders() {
      return new Promise((resolve, reject) => {
         GM_xmlhttpRequest({
            url: EAGLE_GET_FOLDERS_API_URL,
            method: "GET",
            redirect: 'follow',
            onload: function (response) {
               if (response.status !== 200) {
                  reject();
               }
               resolve(JSON.parse(response.response).data);
            }
         });
      })
   }
   // 创建文件夹
   function creatFolder(folderName) {
      return new Promise((resolve, reject) => {
         GM_xmlhttpRequest({
            url: EAGLE_CREATE_FOLDER_API_URL,
            method: "POST",
            data: JSON.stringify({ folderName: folderName }),
            onload: function (response) {
               var result = JSON.parse(response.response);
               if (result.status === "success" && result.data && result.data.id) {
                  return resolve(result.data);
               }
               else {
                  return reject();
               }
            }
         })
      })
   }
   // 数组去重
   function Do_not(arr) {
      console.log('---开始数据去重---');
      if (!Array.isArray(arr)) {
         console.log('数据错误!');
         return;
      }
      let res = [arr[0]]
      for (let i = 1; i < arr.length; i++) {
         let flag = true
         for (let j = 0; j < res.length; j++) {
            if (arr[i] === res[j]) {
               flag = false;
               break;
            }
         }
         if (flag) {
            res.push(arr[i]);
         }
      }
      return res;
   }
   // 解决网页懒加载最简单粗暴的方法翻页翻页的时候创建文件夹
   function scroAll() {
      // go_Folder()
      let webSY = window.scrollY;
      window.scroll(
         {
            top: 9999999,
            left: 0,
            behavior: 'smooth'
         }
      );
      if (webSY !== 0) { setTimeout(function () { window.scroll({ top: webSY, left: 0, behavior: 'smooth' }); lazyload=1}, 1200); }
      else { setTimeout(function () { window.scroll({ top: 0, left: 0, behavior: 'smooth' });  lazyload=1}, 1200); }
      return true
   }
   // 因为我懒
   function log(a) { console.log(a) }
   // 设置一个排序
   function MIU_NUM(num, n) {
      return (Array(n).join(0) + num).slice(-n);
   }
   // 大图解析
   function MAXimg(url) {
      return url
         .replace(/_[.]webp/img, '')    //_.webp
         .replace(/_\d+x\d+[.](je?pg|png|gif|wepb)/img, '')  //_pic.jpg_60x60.jpg
         .replace(/_\d+x\d+[a-z]\d+[.](je?pg|png|gif|wepb)/img, '') //.jpg_60x60q90.jpg
         .replace(/https?:/img, '') //移除所有连接的协议头无论有没有
         .replace(/(\\\\+|\/\/+)?img\.alicdn\.com\/tps\/[a-z]\d\/T10B2IXb4cXXcHmcPq(-\d+-\d+[.]gif)?/img, '') //详情页默认的gif防盗
         .replace(/(\\\\+|\/\/+)?img\.alicdn\.com.{1,12}\/spaceball.gif/img, '') //详情页默认的png防盗
         .replace(/([.](je?pg|png|gif|wepb))_\d+x\d+[a-z]\d+/img, '$1') //.jpg_640x640q80
         .replace(/([.](je?pg|png|gif|wepb))_\d+x\d+([a-z]\d+){2,3}([.](je?pg|png|gif|wepb))?/img, '$1')// .jpg_760x760Q50s50.jpg
         .replace(/(?:.+?)?(\/\/.{1,6}(?:ali|taobao|tb)cdn[.]com\/.+?[.](?:jpe?g|png|gif))(.+?)?$/i, 'https:$1')//只单行加头并且移除本行内所有不需要的信息
         .replace(/[.]\d+x\d+[.](jpe?g|png|gif|webp)(?:(?:_\d+x\d+[a-z]\d+.[a-z]+_(?:.webp)?)?)/i, '.$1')
         .replace("https://cbu01.alicdn.com/cms/upload/other/lazyload.png",'');//黑名单
   }

   // 获取标题
   function title(y) {
      let n = document.title;
      if (n.match(/天猫超市/i)) {
         n = n.match(/^(.+)-天猫超市-(?:.+)?/i)[1];
      } else if
         (n.match(/tmall.com/)) {
         n = n.replace(/-tmall.com天猫/i, '');
      } else if (n.match(/-淘宝网/i)) {
         n = n.replace(/-淘宝网/i, '');
      }
      if (y) {
         n = `标题:${title}`
      }
      return n
   }
   // 获取属性
   function Attribute() {
      let mtitle = '该商品没有填写卖点';
      let head = `${tb_ID}的属性表：\n标题:${title()}\n商品卖点:${mtitle}`
      let list = `${head}很抱歉属性表未找到`
      if (document.querySelector('#detail .tb-detail-hd .newp')) {
         mtitle = document.querySelector('#detail .tb-detail-hd .newp').innerText
      } else if (document.querySelector('#J_mod20 .newAttraction')) {
         mtitle = document.querySelector('#J_mod20 .newAttraction').innerText.replace(/^"|"$/g, '');
      }
      if (document.querySelector('#attributes')) {
         list = head + document.querySelector('#attributes').innerText;
      } else if (document.querySelector('#attributes')) {
         list = head + document.querySelector('#attributes').innerText
      }
      return list;
   }
   // 主图获取
   function zhutu() {
      let zt;
      if (tm === 1) {
         zt = document.querySelectorAll('#J_UlThumb img')
      } else if (tm === 1) {
         zt = document.querySelectorAll('#J_UlThumb img')
      } else if (tb === 1) {
         zt = document.querySelectorAll('#J_UlThumb img')
      } else if (m_tm === 1) {
         zt = document.querySelectorAll('.preview-scroller img')
      } else if (m_tb === 1) {
         zt = document.querySelectorAll('.siema-wrapper .siema img')
      } else if (cs === 1) {
         zt = document.querySelectorAll('#J_UlThumb img')
      } else if (_1688 === 1) {
         zt = document.querySelectorAll('#dt-tab img')
      } else if (m1688 === 1) {
         //懒加载太多放弃手机端的1688了
         zt = document.querySelectorAll('#J_Detail_ImageSlides img')
      }
      else {
         log('HM:你好我是HM此脚本的作者当你看到此消息则证明此脚本运行出现严重错误，请联系作者修复');
         log('HM:未找到主图有可能是网页更新了');
      }
      let jn = new Array();
      for (let i of zt) {
         if (i.src) {
            jn.push(MAXimg(i.src))
         }
      }
      //主图命名规则
      function _name() {
         let na_me = [
            "商品主图",
            "主图_02",
            "主图_03",
            "主图_04",
            "主图_05",
            "主图_06",
            "主图_07",
            "主图_08",
            "主图_09",
            "主图_10",
            "主图_11",
            "主图_12",
            "主图_13",
            "主图_14",
            "主图_15",
            "主图_16",
            "主图_17",
            "主图_18",
            "主图_19",
            "主图_20",
            "主图_21",
            "主图_22",
            "主图_23",
            "主图_24",
            "主图_25",
            "主图_26",
            "主图_27",
            "主图_28",
            "主图_29"
         ]
         if (jn.length = 6) {
            na_me = ["商品主图", "主图_02", "主图_03", "主图_04", "主图_05", "长图"];
         }
         if (tb) {
            na_me = ["商品主图", "主图_02", "主图_03", "主图_04", "白底图", "长图"];
         }
         if (jn) {
            if (jn[0].match(/tbvideo\./)) {
               na_me = ["视频封面", "商品主图", "主图_02", "主图_03", "主图_04", "白底图", "长图"];
            }
         } if (_1688 === 1 && m1688 === 1) {
            na_me = [
               "商品主图",
               "主图_02",
               "主图_03",
               "主图_04",
               "主图_05",
               "主图_06",
               "主图_07",
               "主图_08",
               "主图_09",
               "主图_10",
               "主图_11",
               "主图_12",
               "主图_13",
               "主图_14",
               "主图_15",
               "主图_16",
               "主图_17",
               "主图_18",
               "主图_19",
               "主图_20",
               "主图_21",
               "主图_22",
               "主图_23",
               "主图_24",
               "主图_25",
               "主图_26",
               "主图_27",
               "主图_28",
               "主图_29"
            ]
         }
         return na_me;
      }
      //拼接Eagle数组
      let ju = new Array();
      let ji = { "items": ju, "folderId": fold }
      for (let i in jn) {
         ju.push({ url: jn[i], name: (_name()[i]), website: tb_url(), annotation: Attribute(), tags: [tb_ID, "商品主图"], modificationTime: (startTime-i*2+1500) })
      }
      // 后台图片与前台不一样这里有分无线端PC端主图和透明图所以另外写个规则
      // arrPC pc端图片组 arrm 手机端图片组  png 透明图  maximg 长图
      function 未支持(params) {
         if (tmm) {
            let name = {
               arrPC: ["PC主图", "PC主图_02", "PC主图_03", "PC主图_04", "PC主图_05"],
               arrm: ["手机主图", "手机主图_02", "手机主图_03", "手机主图_04", "手机主图_05"],
               png: "透明图",
               maximg: "商品长图"
            }
            // 天猫描述页
            let arrPC = document.querySelectorAll('#struct-images img');
            let arrm = document.querySelectorAll('#struct-tmWirelessImages .image-wrap img');
            let png = document.querySelector('#struct-whiteBgImage .tmall-o-image-preview  img')
            let maximg = document.querySelector('#struct-verticalImage img')

         } else if (tmup) {
            let name = {
               arrPC: ["PC主图", "PC主图_02", "PC主图_03", "PC主图_04", "PC主图_05"],
               arrm: ["手机主图", "手机主图_02", "手机主图_03", "手机主图_04", "手机主图_05"],
               png: "透明图",
               maximg: "商品长图",
               _34: ["3-4主图_01", "3-4主图_02", "3-4主图_03", "3-4主图_04", "3-4主图_05", "3-4主图_06",]
            }
            // 天猫标准商家后台
            let arrPC = document.querySelectorAll('#struct-images img');
            let arrm = document.querySelectorAll('#struct-tmWirelessImages .image-wrap img');
            let png = document.querySelector('#struct-whiteBgImage .tmall-o-image-preview  img')
            let maximg = document.querySelector('#struct-verticalImage img')
            let _34 = document.querySelectorAll('#struct-threeToFourImages img')
         } else if (tbup) {
            // 淘宝后台
            let name = {
               arrPC: ["商品主图", "主图_02", "主图_03", "主图_04", "白底图"],
               maximg: "商品长图",
               _34: ["3-4主图_01", "3-4主图_02", "3-4主图_03", "3-4主图_04", "3-4主图_05", "3-4主图_06",]
            }
            let arrPC = document.querySelectorAll('#struct-images img');
            let maximg = document.querySelector('#struct-verticalImage img')
            let _34 = document.querySelectorAll("#struct-threeToFourImages img")

         }
      }
      return ji;
   }
   // 详情页获取
   function Details() {
      let img = [];
      if(tm===1){
      if (document.querySelector('#description img')) {
         //天猫PC
         img = document.querySelectorAll('#description img')
      }} else if (tb===1){ if (document.querySelector('#J_DivItemDesc img')) {
         //淘宝PC
         img = document.querySelectorAll('#description img')
      } }else if (m_tm===1) {if (document.querySelector('#modules-desc img')) {
         //天猫移动端
         img = document.querySelectorAll('#modules-desc img')
      }} else if(m_tb===1){if (document.querySelector('#detail img')) {
         //淘宝移动端 事情最多的网页
         img = document.querySelectorAll('#detail img')
      }} else if(m1688===1){if (document.querySelector('#J_WapDetailCommonDescription_Content img')) {
         //1688移动端，我挺好奇这id为啥这么丧心病狂的长
         img = document.querySelectorAll('#J_WapDetailCommonDescription_Content img')
      }} else if(_1688===1){if(document.querySelector('#de-description-detail img')){
         // 1688pc端
         img = document.querySelectorAll('#de-description-detail img')
      }} else if(cs===1){
         // 天猫超市
         img = document.querySelectorAll('#description img')
      }
      //还有几个端还没写 天猫后台淘宝后台
      let text = "详情页没有找到文本";
      if (document.querySelector('#description')) {
         //天猫PC 天猫超市也一样
         text = document.querySelector('#description').innerText
      } else if (document.querySelector('#J_DivItemDesc')) {
         //淘宝PC
         text = document.querySelector('#J_DivItemDesc').innerText
      } else if (document.querySelector('#modules-desc')) {
         //天猫移动端
         text = document.querySelector('#modules-desc').innerText
      } else if (document.querySelector('#detail')) {
         //淘宝移动端 事情最多的网页
         text = document.querySelector('#detail').innerText
      } else if (document.querySelector('#J_WapDetailCommonDescription_Content')) {
         //1688移动端
         text = document.querySelector('#J_WapDetailCommonDescription_Content').innerText
      } else if (document.querySelector('#de-description-detail')) {
         text = document.querySelector('#de-description-detail').innerText
      }
      if (text === "" && text.replace(/[\s\n\r]+/, '') === "") { text = "详情页没有找到文本" }
      //还有几个端还没写 天猫后台淘宝后台
      let imgurl = new Array();
      for (let url of img) {
         let src = url.dataset.src || url.dataset.ksLazyload || url.src;
         if (!src) {
            if (url.innerHTML.match(/(\/\/img.+?com.+?[.](?:jpe?g|png|webp|gif))/)) {
               src = url.innerHTML.match(/(\/\/img.+?com.+?[.](?:jpe?g|png|webp|gif))/)[1]
            }else if(url.outerHTML.match(/(\/\/img.+?com.+?[.](?:jpe?g|png|webp|gif))/)){
               src =  url.outerHTML.match(/\/\/.+?(?:com|cn|xyz|top).+[.](?:jpe?g|png|webp|gif)/)
            }
         }

         if (src) {
            // 默认的懒加载图片
            if (!src.match(/img-tmdetail.alicdn.com\/tps\/i3\/T1BYd_XwFcXXb9RTPq-90-90.png/)
               && !src.match(/spaceball.gif/)
               && !src.match(/CUdsY9YBuNjy0FgXXcxcXXa-1572-394.png/)
               && !src.match(/T10B2IXb4cXXcHmcPq-85-85.gif/)
               && !src.match(/wAAACH5BAUAAAAALAAAAAACAAEAAAICBAoAOw/)
               && !src.match(/TB1k9XsQpXXXXXLXpXXXXXXXXXX-750-368.png/)
               && !src.match(/TB1AHXiGXXXXXXAXVXX.uTD.FXX-10-10.png/)
               && !src.match(/TB1oOXFXDM11u4jSZPxSuuhcXXa.jpg/)
            ) {
               imgurl.push(MAXimg(src))
            }
         }
      }
      let ju = new Array();
      let ji = { "items": ju, "folderId": fold }
      for (let i = 0; i < imgurl.length; i++) {
         ju.push({ url: imgurl[i], name: `详情页_${MIU_NUM((i * 1 + 1), 2)}`, website: tb_url(), annotation: text, tags: [tb_ID, "详情页"], modificationTime: ((startTime-i*2-2800)) })
      }
      return ji;
   }
   // 获取SKU
   function SKU() {
      let sku = [{ url: '', name: '' }];
      if (tm === 1) {
         if (document.querySelector('#J_DetailMeta .tb-img  li')) {
            //天猫的SKU
            let img = document.querySelectorAll('#J_DetailMeta .tb-img  li');
            let json = [];
            for (let l of img) {
               if (l.innerHTML.replace(/[\r\n\s\t ]/img, '').match(/\/\/.+?(?:jpe?g|png|gif|wepb)/)) {
                  let _name = l.innerText.replace(/[\n]+/img, '').replace(/([\t\s ])+/img, '$1');
                  let url = l.innerHTML.replace(/[\r\n\s\t ]/img, '').match(/\/\/.+?(?:jpe?g|png|gif|wepb)/)[0];
                  json.push({ url: MAXimg(url), name: _name })
               }
            }
            sku = json
         }
      } else if (tb === 1) {
         if (document.querySelector('#J_isku .tb-img li')) {
            //淘宝网的SKU
            let json = [];
            let img = document.querySelectorAll('#J_isku .tb-img li');
            for (let l of img) {
               if (l.innerHTML.replace(/[\r\n\s\t ]/img, '').match(/\/\/.+?(?:jpe?g|png|gif|wepb)/)) {
                  let _name = l.querySelector('span').innerText.replace(/[\n]+/img, '').replace(/([\t\s ])+/img, '$1');
                  let url = l.innerHTML.replace(/[\r\n\s\t ]/img, '').match(/\/\/.+?(?:jpe?g|png|gif|wepb)/)[0];
                  json.push({ url: MAXimg(url), name: _name })
               }
            }
            sku = json
         }
      } else if (m_tm === 1) {
         //手机天猫的SKU
         if (document.querySelector("#s-actionBar-container .trade .buy")) {
            document.querySelector("#s-actionBar-container .trade .buy").click()
            setTimeout(function () {
               if (document.querySelector('.sku-list-wrap .items a .prop-img')) {

                  for (let i of document.querySelectorAll('.sku-list-wrap .items a')) {
                     if (i.querySelector('.prop-img')) {
                        let url = i.querySelector('.prop-img').src;
                        let name = i.innerText.replace(/[\n]+/img, '').replace(/([\t\s ])+/img, '$1');
                        sku.push({ url: MAXimg(url), name: name })
                     }
                  }

               }
            }, 200);
         }
      } else if (m_tb === 1) {
         log('SKU：该网站千变万化正在寻找更好方式')
      } else if (_1688 === 1) {
         ;if(document.querySelector("#mod-detail-bd > div.region-custom.region-detail-property.region-takla.ui-sortable.region-vertical > div.widget-custom.offerdetail_ditto_purchasing > div > div > div > div.obj-sku > div.obj-expand > a > i > em")){
            document.querySelector("#mod-detail-bd > div.region-custom.region-detail-property.region-takla.ui-sortable.region-vertical > div.widget-custom.offerdetail_ditto_purchasing > div > div > div > div.obj-sku > div.obj-expand > a > i > em").click()}
         if (
            document.querySelector('#mod-detail-bd .list-leading li ')) {
            let arr = document.querySelectorAll('#mod-detail-bd .list-leading li');
            let ar = [];
            if (document.querySelectorAll('#mod-detail-bd .list-leading li a')) {
               for (let i = 0; i < arr.length; i++) {
                  if (arr[i].querySelector('a')) {
                     let o = arr[i].querySelector('a');
                     if (arr[i].querySelector('a .vertical-img-title')) {
                        let name = o.querySelector('.vertical-img-title').innerText.replace(/[\n]+/img, '').replace(/([\t\s ])+/img, '$1');
                        let img = o.querySelector('img').src;
                        ar.push({ url: MAXimg(img), name: name });
                     }
                  }

               } sku = ar;
            }
         }else if(document.querySelectorAll('#mod-detail-bd  .table-sku  ')){
            let arr =document.querySelectorAll('#mod-detail-bd  .table-sku tr ');
            let ar = [];
            for (let i = 0; i < arr.length; i++) {
               let name = arr[i].querySelector('span').title;
               let img = arr[i].querySelector('img').src;
               ar.push({ url: MAXimg(img), name: name });
            }sku = ar;}
      } else if (m1688 === 1) {
         log('该网站千变万化正在寻找更好方式')
      } else {
         log('很抱歉找不到SKU图片')
      }
      let ju = [];
      let ji = { "items": ju, "folderId": fold }
      let n = 0;
      for (let i of sku) {
         ju.push({ url: i.url, name: i.name, website: tb_url(), tags: [tb_ID, "SKU"], modificationTime: (((startTime-i*2-700)) ) });
         n + 1;
      }
      if (ji.items[0].url) {
         return ji;
      }

   }

   // 获取视频
   function Video() {
      let url = '';
      if (tm === 1 ) {
         // 天猫主图视频
         if (document.querySelector('#J_DetailMeta .lib-video ')) {
            // 网页元素法优先
            if (document.querySelector('#J_DetailMeta .lib-video ').innerHTML.match(/\/\/cloud.+?play.+?[.]mp4(?:[?]appKey=\d+)?/)) {
               url = document.querySelector('#J_DetailMeta .lib-video ').innerHTML.match(/\/\/cloud.+?play.+?[.]mp4(?:[?]appKey=\d+)?/)[0]
            }
            //找不到网页元素的链接使用枚举法拼接链接
            if (!url) {
               let script = document.querySelectorAll('script');
               let ID_img = '';
               let user_id = '';
               for (let i of script) {
                  if (i.innerText) {
                     if (i.innerText.match(/"imgVedioID":"(\d+)"/)) {
                        ID_img = i.innerText.match(/"imgVedioID":"(\d+)"/)[1]
                     }
                     if (i.innerText.match(/"userId":"(\d+)"/)) {
                        user_id = i.innerText.match(/"userId":"(\d+)"/)[1]
                     }
                     if (ID_img || user_id) {
                        url = `https://cloud.video.taobao.com/play/u/${user_id}/p/1/e/6/t/1/${ID_img}.mp4`;
                        break;
                     }
                  }
               }

            }

         }
      }
      else if (cs === 1 ) {
         // 天猫主图视频
         if (document.querySelector('#J_DetailMeta .lib-video ')) {
            // 网页元素法优先
            if (document.querySelector('#J_DetailMeta .lib-video ').innerHTML.match(/\/\/cloud.+?play.+?[.]mp4(?:[?]appKey=\d+)?/)) {
               url = document.querySelector('#J_DetailMeta .lib-video ').innerHTML.match(/\/\/cloud.+?play.+?[.]mp4(?:[?]appKey=\d+)?/)[0]
            }
            //找不到网页元素的链接使用枚举法拼接链接
            if (!url) {
               let script = document.querySelectorAll('script');
               let ID_img = '';
               let user_id = '';
               for (let i of script) {
                  if (i.innerText) {
                     if (i.innerText.match(/"imgVedioID":"(\d+)"/)) {
                        ID_img = i.innerText.match(/"imgVedioID":"(\d+)"/)[1]
                     }
                     if (i.innerText.match(/"userId":"(\d+)"/)) {
                        user_id = i.innerText.match(/"userId":"(\d+)"/)[1]
                     }
                     if (ID_img || user_id) {
                        url = `https://cloud.video.taobao.com/play/u/${user_id}/p/1/e/6/t/1/${ID_img}.mp4`;
                        break;
                     }
                  }
               }

            }

         }
      }else
      if (m_tm === 1) {
         if (document.querySelector('#content .item-video ')) {
            if (document.querySelector('#content  ').innerHTML.match(/\/\/cloud.+?play.+?[.]mp4(?:[?]appKey=\d+)?/)) {
               url = document.querySelector('#content  ').innerHTML.match(/\/\/cloud.+?play.+?[.]mp4(?:[?]appKey=\d+)?/)[0];
            }
            if (!url) {
               for (let i of script) {
                  if (i.innerText.match(/\/\/cloud.+?play.+?[.]mp4(?:[?]appKey=\d+)?/)) {
                     url = i.innerText.match(/\/\/cloud.+?play.+?[.]mp4(?:[?]appKey=\d+)?/)[0];
                     if (url) {
                        break;
                     }
                  }
               }
            }
         }
      }else
      if (tb === 1) {
         let script = document.querySelectorAll('script');
         let ID_img = '';
         let user_id = '';
         if (document.querySelector('meta[name="microscope-data"]')) {
            user_id = document.querySelector('meta[name="microscope-data"]').content.match(/userid=(\d+);/)[1]
         }
         if (user_id) {
            for (let i of script) {
               if (i.innerText) {
                  if (i.innerText.match(/"videoId":"(\d+)"/)) {
                     ID_img = i.innerText.match(/"videoId":"(\d+)"/)[1];
                     url = `https://cloud.video.taobao.com/play/u/${user_id}/p/1/e/6/t/1/${ID_img}.mp4`;
                     break;
                  }
               }
            }
         }
      }else
      if (m_tb === 1) {
         log('手机端的淘宝暂时不支持主图视频获取')
      }else
      if (_1688 === 1) {
         if (document.querySelector('#detail-main-video-content .lib-video ')) {
            if (document.querySelector('#detail-main-video-content .lib-video ').innerHTML.match(/\/\/cloud.+?play.+?[.]mp4(?:[?]appKey=\d+)?/)) {
               url = document.querySelector('#detail-main-video-content .lib-video ').innerHTML.match(/\/\/cloud.+?play.+?[.]mp4(?:[?]appKey=\d+)?/)[0]
            }
         }
      }else
      if (m1688 === 1) {
         let i = document.querySelector('#widget-wap-detail-common-image .video-tag')
         if (i) {
            if (i.innerHTML) {
               if (i.innerHTML.match(/\/\/cloud.+?play.+?[.]mp4(?:[?]appKey=\d+)?/)) { url = i.innerHTML.match(/\/\/cloud.+?play.+?[.]mp4(?:[?]appKey=\d+)?/)[0] }
            }
         }
      }
      let ji = { "items": [{ url: url, name: "主图视频", website: tb_url(), tags: [tb_ID, "主图视频"], modificationTime: startTime }], "folderId": fold }
      return ji;
   }
   // 获取详情页上的视频（只返回链接）
   function Details_Video() {
      let url = '';
      if (tm === 1 && cs === 1) {
         if (document.querySelector('#page #item-flash ')) {
            if (document.querySelector('#page #item-flash .lib-video  source ')) {
               url = document.querySelector('#page #item-flash .lib-video  source ').src;
            }
         }
      } else if (tb === 1) {
         //没找到相关链接
      } else if (m_tm === 1) {
         if (document.querySelector('#modules-desc .item a')) {
            url = document.querySelector('#modules-desc .item a').href;
         }
      }
      let ju = new Array();
      let ji = { "items": ju, "folderId": fold }
      ju.push({ url: url, name: "详情页视频", website: tb_url(), tags: [tb_ID, "详情视频"], modificationTime: startTime })
      if (ji.items[0].url) {
         return ji;
      }
   }



})();

/**这个是用于弹窗的库 没必要使用未压缩文本*/
!function(a, b) {
   "object" == typeof exports && "undefined" != typeof module ? module.exports = b :"function" == typeof define && define.amd ? define([], function() {
       return b(a);
   }) :a.Qmsg = b(a);
}(this, function(a) {
   "use srtict";
   function i() {
       var b, a = d;
       for (b = 0; b < arguments.length; ++b) a += "-" + arguments[b];
       return a;
   }
   function j(a) {
       var c, h, j, l, m, n, p, q, r, s, b = this;
       b.settings = Object.assign({}, f, a || {}), b.id = o.instanceCount, c = b.settings.timeout,
       c = c && parseInt(c >= 0) & parseInt(c) <= Math.NEGATIVE_INFINITY ? parseInt(c) :f.timeout,
       b.timeout = c, b.settings.timeout = c, b.timer = null, h = document.createElement("div"),
       j = g[b.settings.type || "info"], l = i("content-" + b.settings.type || "info"),
       l += b.settings.showClose ? " " + i("content-with-close") :"", m = b.settings.content || "",
       n = g["close"], p = b.settings.showClose ? '<i class="qmsg-icon qmsg-icon-close">' + n + "</i>" :"",
       q = document.createElement("span"), b.settings.html ? q.innerHTML = m :q.innerText = m,
       h.innerHTML = '<div class="qmsg-content">            <div class="' + l + '">                <i class="qmsg-icon">' + j + "</i>" + q.outerHTML + p + "</div>        </div>",
       h.classList.add(i("item")), h.style.textAlign = b.settings.position, r = document.querySelector("." + d),
       r || (r = document.createElement("div"), r.classList.add(d, i("wrapper"), i("is-initialized")),
       document.body.appendChild(r)), r.appendChild(h), b.$wrapper = r, b.$elem = h, k(b, "opening"),
       b.settings.showClose && h.querySelector(".qmsg-icon-close").addEventListener("click", function() {
           b.close();
       }.bind(h)), h.addEventListener("animationend", function(a) {
           var b = a.target, c = a.animationName;
           c == e["closing"] && (clearInterval(this.timer), this.destroy()), b.style.animationName = "",
           b.style.webkitAnimationName = "";
       }.bind(b)), b.settings.autoClose && (s = 10, b.timer = setInterval(function() {
           this.timeout -= s, this.timeout <= 0 && (clearInterval(this.timer), this.close());
       }.bind(b), s), b.$elem.addEventListener("mouseover", function() {
           clearInterval(this.timer);
       }.bind(b)), b.$elem.addEventListener("mouseout", function() {
           "closing" != this.state && (this.timer = setInterval(function() {
               this.timeout -= s, this.timeout <= 0 && (clearInterval(this.timer), this.close());
           }.bind(b), s));
       }.bind(b)));
   }
   function k(a, b) {
       b && e[b] && (a.state = b, a.$elem.style.animationName = e[b]);
   }
   function l(a) {
       var b = i("count"), c = a.$elem.querySelector("." + i("content")), d = c.querySelector("." + b);
       d || (d = document.createElement("span"), d.classList.add(b), c.appendChild(d)),
       d.innerHTML = a.count, d.style.animationName = "", d.style.animationName = "MessageShake",
       a.timeout = a.settings.timeout || f.timeout;
   }
   function m(a, b) {
       var c = Object.assign({}, f);
       return 0 === arguments.length ? c :a instanceof Object ? Object.assign(c, a) :(c.content = a.toString(),
       b instanceof Object ? Object.assign(c, b) :c);
   }
   function n(a) {
       var b, c, d, e, f, g, h, i, k, m;
       a = a || {}, b = JSON.stringify(a), c = -1;
       for (e in this.oMsgs) if (f = this.oMsgs[e], f.config == b) {
           c = e, d = f.inst;
           break;
       }
       if (0 > c) {
           if (this.instanceCount++, g = {}, g.id = this.instanceCount, g.config = b, d = new j(a),
           d.id = this.instanceCount, d.count = "", g.inst = d, this.oMsgs[this.instanceCount] = g,
           h = this.oMsgs.length, i = this.maxNums, h > i) for (k = 0, m = this.oMsgs, k; h - i > k; k++) m[k] && m[k].inst.settings.autoClose && m[k].inst.close();
       } else d.count = d.count ? d.count >= 99 ? d.count :d.count + 1 :2, l(d);
       return d.$elem.setAttribute("data-count", d.count), d;
   }
   var b, c, d, e, f, g, h, o;
   return "function" != typeof Object.assign && (Object.assign = function(a) {
       var b, c, d;
       if (null == a) throw new TypeError("Cannot convert undefined or null to object");
       for (a = Object(a), b = 1; b < arguments.length; b++) if (c = arguments[b], null != c) for (d in c) Object.prototype.hasOwnProperty.call(c, d) && (a[d] = c[d]);
       return a;
   }), b = "classList" in HTMLElement.prototype, b || Object.defineProperty(HTMLElement.prototype, "classList", {
       get:function() {
           var a = this;
           return {
               add:function(b) {
                   this.contains(b) || (a.className += " " + b);
               },
               remove:function(b) {
                   if (this.contains(b)) {
                       var c = new RegExp(b);
                       a.className = a.className.replace(c, "");
                   }
               },
               contains:function(b) {
                   var c = a.className.indexOf(b);
                   return -1 != c ? !0 :!1;
               },
               toggle:function(a) {
                   this.contains(a) ? this.remove(a) :this.add(a);
               }
           };
       }
   }), c = "qmsg", d = a && a.QMSG_GLOBALS && a.QMSG_GLOBALS.NAMESPACE || c, e = {
       opening:"MessageMoveIn",
       done:"",
       closing:"MessageMoveOut"
   }, f = Object.assign({
       position:"center",
       type:"info",
       showClose:!1,
       timeout:2500,
       animation:!0,
       autoClose:!0,
       content:"",
       onClose:null,
       maxNums:5,
       html:!1
   }, a && a.QMSG_GLOBALS && a.QMSG_GLOBALS.DEFAULTS), g = {
       info:'<svg width="16" height="16" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="48" height="48" fill="white" fill-opacity="0.01"/><path d="M24 44C29.5228 44 34.5228 41.7614 38.1421 38.1421C41.7614 34.5228 44 29.5228 44 24C44 18.4772 41.7614 13.4772 38.1421 9.85786C34.5228 6.23858 29.5228 4 24 4C18.4772 4 13.4772 6.23858 9.85786 9.85786C6.23858 13.4772 4 18.4772 4 24C4 29.5228 6.23858 34.5228 9.85786 38.1421C13.4772 41.7614 18.4772 44 24 44Z" fill="#1890ff" stroke="#1890ff" stroke-width="4" stroke-linejoin="round"/><path fill-rule="evenodd" clip-rule="evenodd" d="M24 11C25.3807 11 26.5 12.1193 26.5 13.5C26.5 14.8807 25.3807 16 24 16C22.6193 16 21.5 14.8807 21.5 13.5C21.5 12.1193 22.6193 11 24 11Z" fill="#FFF"/><path d="M24.5 34V20H23.5H22.5" stroke="#FFF" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M21 34H28" stroke="#FFF" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
       warning:'<svg width="16" height="16" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="48" height="48" fill="white" fill-opacity="0.01"/><path d="M24 44C29.5228 44 34.5228 41.7614 38.1421 38.1421C41.7614 34.5228 44 29.5228 44 24C44 18.4772 41.7614 13.4772 38.1421 9.85786C34.5228 6.23858 29.5228 4 24 4C18.4772 4 13.4772 6.23858 9.85786 9.85786C6.23858 13.4772 4 18.4772 4 24C4 29.5228 6.23858 34.5228 9.85786 38.1421C13.4772 41.7614 18.4772 44 24 44Z" fill="#faad14" stroke="#faad14" stroke-width="4" stroke-linejoin="round"/><path fill-rule="evenodd" clip-rule="evenodd" d="M24 37C25.3807 37 26.5 35.8807 26.5 34.5C26.5 33.1193 25.3807 32 24 32C22.6193 32 21.5 33.1193 21.5 34.5C21.5 35.8807 22.6193 37 24 37Z" fill="#FFF"/><path d="M24 12V28" stroke="#FFF" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
       error:'<svg width="16" height="16" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="48" height="48" fill="white" fill-opacity="0.01"/><path d="M24 44C35.0457 44 44 35.0457 44 24C44 12.9543 35.0457 4 24 4C12.9543 4 4 12.9543 4 24C4 35.0457 12.9543 44 24 44Z" fill="#f5222d" stroke="#f5222d" stroke-width="4" stroke-linejoin="round"/><path d="M29.6569 18.3431L18.3432 29.6568" stroke="#FFF" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M18.3432 18.3431L29.6569 29.6568" stroke="#FFF" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
       success:'<svg width="16" height="16" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="48" height="48" fill="white" fill-opacity="0.01"/><path d="M24 4L29.2533 7.83204L35.7557 7.81966L37.7533 14.0077L43.0211 17.8197L41 24L43.0211 30.1803L37.7533 33.9923L35.7557 40.1803L29.2533 40.168L24 44L18.7467 40.168L12.2443 40.1803L10.2467 33.9923L4.97887 30.1803L7 24L4.97887 17.8197L10.2467 14.0077L12.2443 7.81966L18.7467 7.83204L24 4Z" fill="#52c41a" stroke="#52c41a" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M17 24L22 29L32 19" stroke="#FFF" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
       loading:'<svg class="animate-turn" width="16" height="16" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="48" height="48" fill="white" fill-opacity="0.01"/><path d="M4 24C4 35.0457 12.9543 44 24 44V44C35.0457 44 44 35.0457 44 24C44 12.9543 35.0457 4 24 4" stroke="#1890ff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M36 24C36 17.3726 30.6274 12 24 12C17.3726 12 12 17.3726 12 24C12 30.6274 17.3726 36 24 36V36" stroke="#1890ff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
       close:'<svg width="16" height="16" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="48" height="48" fill="white" fill-opacity="0.01"/><path d="M14 14L34 34" stroke="#909399" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M14 34L34 14" stroke="#909399" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg>'
   }, h = function() {
       var a = document.createElement("div").style;
       return void 0 !== a.animationName || void 0 !== a.WebkitAnimationName || void 0 !== a.MozAnimationName || void 0 !== a.msAnimationName || void 0 !== a.OAnimationName;
   }(), j.prototype.destroy = function() {
       this.$elem.parentNode && this.$elem.parentNode.removeChild(this.$elem), clearInterval(this.timer),
       o.remove(this.id);
   }, j.prototype.close = function() {
       k(this, "closing"), h ? o.remove(this.id) :this.destroy();
       var a = this.settings.onClose;
       a && a instanceof Function && a.call(this);
   }, o = {
       version:"0.0.1",
       instanceCount:0,
       oMsgs:[],
       maxNums:f.maxNums || 5,
       config:function(a) {
           f = a && a instanceof Object ? Object.assign(f, a) :f, this.maxNums = f.maxNums && f.maxNums > 0 ? parseInt(f.maxNums) :3;
       },
       info:function(a, b) {
           var c = m(a, b);
           return c.type = "info", n.call(this, c);
       },
       warning:function(a, b) {
           var c = m(a, b);
           return c.type = "warning", n.call(this, c);
       },
       success:function(a, b) {
           var c = m(a, b);
           return c.type = "success", n.call(this, c);
       },
       error:function(a, b) {
           var c = m(a, b);
           return c.type = "error", n.call(this, c);
       },
       loading:function(a, b) {
           var c = m(a, b);
           return c.type = "loading", c.autoClose = !1, n.call(this, c);
       },
       remove:function(a) {
           this.oMsgs[a] && delete this.oMsgs[a];
       },
       closeAll:function() {
           for (var a in this.oMsgs) this.oMsgs[a] && this.oMsgs[a].inst.close();
       }
   };
});