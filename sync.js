(function(){
  var LZS='https://cdn.jsdelivr.net/npm/lz-string@1.5.0/libs/lz-string.min.js';
  var QRCDN='https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js';

  function loadScript(url,cb){
    var s=document.createElement('script');s.src=url;
    s.onload=cb;s.onerror=function(){cb&&cb();};
    document.head.appendChild(s);
  }

  function getSyncURL(){
    var data=localStorage.getItem('med_main')||'[]';
    var enc=window.LZString
      ?LZString.compressToEncodedURIComponent(data)
      :btoa(encodeURIComponent(data));
    return location.origin+location.pathname+'#sync='+enc;
  }

  function checkSyncHash(){
    var h=location.hash;
    if(h.indexOf('#sync=')!==0)return;
    try{
      var encoded=h.slice(6);
      var json=null;
      if(window.LZString){json=LZString.decompressFromEncodedURIComponent(encoded);}
      if(!json){try{json=decodeURIComponent(atob(encoded));}catch(e2){}}
      var d=JSON.parse(json);
      if(Array.isArray(d)&&confirm(d.length+'件のメモを同期しますか?\n現在のデータは上書きされます')){
        localStorage.setItem('med_main',JSON.stringify(d));
        history.replaceState(null,'',location.pathname);
        location.reload();
      }else history.replaceState(null,'',location.pathname);
    }catch(e){history.replaceState(null,'',location.pathname);}
  }

  function addSyncUI(){
    var s=document.createElement('style');
    s.textContent=
      '.sfab{position:fixed;bottom:76px;right:16px;z-index:9999;width:48px;height:48px;'+
      'border-radius:50%;background:#1d4ed8;border:2px solid #3b82f6;color:#fff;'+
      'font-size:22px;cursor:pointer;display:flex;align-items:center;justify-content:center;'+
      'box-shadow:0 2px 12px rgba(0,0,0,.5);transition:.2s}'+
      '.sfab:hover{background:#2563eb;transform:scale(1.1)}'+
      '.sp{position:fixed;bottom:132px;right:16px;z-index:9999;background:#0f1b35;'+
      'border:1px solid #2d4a8a;border-radius:14px;padding:14px;width:210px;'+
      'box-shadow:0 8px 32px rgba(0,0,0,.5);display:none}'+
      '.sp.o{display:block}'+
      '.sp h4{margin:0 0 8px;color:#93c5fd;font-size:11px;text-transform:uppercase}'+
      '.sp button{display:block;width:100%;margin:4px 0;padding:8px 12px;'+
      'background:#1e3a6e;border:1px solid #2d5aa0;color:#e2e8f0;border-radius:8px;'+
      'cursor:pointer;font-size:13px;text-align:left;transition:.15s}'+
      '.sp button:hover{background:#254d94;color:#fff}'+
      '.qr-overlay{position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,.8);'+
      'display:flex;align-items:center;justify-content:center}'+
      '.qr-box{background:#0f1b35;border:1px solid #2d4a8a;border-radius:16px;padding:24px 20px;'+
      'text-align:center;max-width:300px;width:90%;box-shadow:0 8px 40px rgba(0,0,0,.7)}'+
      '.qr-box h3{margin:0 0 6px;color:#93c5fd;font-size:15px}'+
      '.qr-box p{margin:0 0 16px;color:#94a3b8;font-size:12px;line-height:1.6}'+
      '.qr-canvas{background:#fff;padding:10px;border-radius:8px;display:inline-block}'+
      '.qr-close{margin-top:16px;padding:9px 28px;background:#1e3a6e;border:1px solid #2d5aa0;'+
      'color:#e2e8f0;border-radius:8px;cursor:pointer;font-size:13px}'+
      '.qr-close:hover{background:#254d94}'+
      '.qr-warn{color:#fbbf24;font-size:12px;margin-top:12px}';
    document.head.appendChild(s);

    var f=document.createElement('button');
    f.className='sfab';f.innerHTML='\uD83D\uDD04';f.title='\u30C7\u30FC\u30BF\u540C\u671F';

    var panel=document.createElement('div');
    panel.className='sp';
    panel.innerHTML='<h4>\uD83D\uDCF1 \u30C7\u30D0\u30A4\u30B9\u9593\u540C\u671F</h4>';

    function btn(t,fn){var b=document.createElement('button');b.textContent=t;b.onclick=fn;panel.appendChild(b);}

    btn('\uD83D\uDCF7 QR\u30B3\u30FC\u30C9\u3067\u8EE2\u9001',function(){
      panel.classList.remove('o');
      if(window.LZString&&window.QRCode){showQR();return;}
      loadScript(LZS,function(){loadScript(QRCDN,function(){showQR();});});
    });

    btn('\uD83D\uDCCB \u540C\u671FURL\u3092\u30B3\u30D4\u30FC',function(){
      try{
        if(window.LZString){
          var url=getSyncURL();
          navigator.clipboard.writeText(url).then(function(){
            alert('\u2705 \u30B3\u30D4\u30FC\u3057\u307E\u3057\u305F!\n\u30B9\u30DE\u30DB\u306E\u30D6\u30E9\u30A6\u30B6\u306B\u8CBC\u308A\u4ED8\u3051\u3066\u958B\u304F\u3068\u30E1\u30E2\u304C\u540C\u671F\u3055\u308C\u307E\u3059');
          }).catch(function(){prompt('URL\u3092\u30B9\u30DE\u30DB\u3067\u958B\u3044\u3066\u304F\u3060\u3055\u3044:',url);});
        }else{
          loadScript(LZS,function(){
            var url=getSyncURL();
            navigator.clipboard.writeText(url).then(function(){
              alert('\u2705 \u30B3\u30D4\u30FC\u3057\u307E\u3057\u305F!');
            }).catch(function(){prompt('URL:',url);});
          });
        }
      }catch(e){}
    });

    btn('\u2B07\uFE0F JSON\u30A8\u30AF\u30B9\u30DD\u30FC\u30C8',function(){
      var blob=new Blob([localStorage.getItem('med_main')||'[]'],{type:'application/json'});
      var a=document.createElement('a');a.href=URL.createObjectURL(blob);
      a.download='memo-'+(new Date().toISOString().slice(0,10))+'.json';
      a.click();URL.revokeObjectURL(a.href);
    });

    btn('\u2B06\uFE0F JSON\u30A4\u30F3\u30DD\u30FC\u30C8',function(){
      var i=document.createElement('input');i.type='file';i.accept='.json';
      i.onchange=function(e){
        var fi=e.target.files[0];if(!fi)return;
        var r=new FileReader();
        r.onload=function(ev){
          try{
            var d=JSON.parse(ev.target.result);
            if(Array.isArray(d)&&confirm(d.length+'\u4EF6\u8AAD\u307F\u8FBC\u307F\u307E\u3059\u3002\u73FE\u5728\u306E\u30C7\u30FC\u30BF\u306F\u4E0A\u66F8\u304D\u3055\u308C\u307E\u3059')){
              localStorage.setItem('med_main',JSON.stringify(d));location.reload();
            }
          }catch(e){alert('\u30D5\u30A1\u30A4\u30EB\u304C\u6B63\u3057\u304F\u3042\u308A\u307E\u305B\u3093');}
        };r.readAsText(fi);
      };i.click();
    });

    function showQR(){
      var url=getSyncURL();
      var count=0;try{count=JSON.parse(localStorage.getItem('med_main')||'[]').length;}catch(e){}
      var tooLong=url.length>2500;

      var overlay=document.createElement('div');overlay.className='qr-overlay';
      overlay.innerHTML=
        '<div class="qr-box">'+
        '<h3>\uD83D\uDCF7 QR\u30B3\u30FC\u30C9\u3092\u30B9\u30AD\u30E3\u30F3</h3>'+
        '<p>\u30B9\u30DE\u30DB\u306E\u30AB\u30E1\u30E9\u3067\u8AAD\u307F\u53D6\u308B\u3068<br>\u30E1\u30E2 '+count+'\u4EF6\u304C\u540C\u671F\u3055\u308C\u307E\u3059</p>'+
        (tooLong?'<div class="qr-warn">\u26A0\uFE0F \u30C7\u30FC\u30BF\u304C\u5927\u304D\u3059\u304E\u308B\u305F\u3081QR\u30B3\u30FC\u30C9\u3067\u306F\u8EE2\u9001\u3067\u304D\u307E\u305B\u3093\u3002<br>JSON\u30A8\u30AF\u30B9\u30DD\u30FC\u30C8/\u30A4\u30F3\u30DD\u30FC\u30C8\u3092\u3054\u5229\u7528\u304F\u3060\u3055\u3044\u3002</div>':'<div class="qr-canvas" id="qr-render"></div>')+
        '<br><button class="qr-close">\u9583\u3058\u308B</button>'+
        '</div>';
      overlay.querySelector('.qr-close').onclick=function(){document.body.removeChild(overlay);};
      overlay.onclick=function(e){if(e.target===overlay)document.body.removeChild(overlay);};
      document.body.appendChild(overlay);

      if(!tooLong){
        try{
          new QRCode(document.getElementById('qr-render'),{
            text:url,width:200,height:200,
            colorDark:'#000000',colorLight:'#ffffff',
            correctLevel:QRCode.CorrectLevel.M
          });
        }catch(e){document.getElementById('qr-render').innerHTML='<p style="color:red;font-size:12px">QR\u751F\u6210\u5931\u6557</p>';}
      }
    }

    f.onclick=function(e){e.stopPropagation();panel.classList.toggle('o');};
    document.addEventListener('click',function(e){
      if(!f.contains(e.target)&&!panel.contains(e.target))panel.classList.remove('o');
    });
    document.body.appendChild(f);
    document.body.appendChild(panel);
  }

  loadScript(LZS,function(){checkSyncHash();});

  if(document.readyState==='loading')
    document.addEventListener('DOMContentLoaded',addSyncUI);
  else addSyncUI();
})();
