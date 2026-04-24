(function(){
  var QRCDN='https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js';
  var LZS='https://cdn.jsdelivr.net/npm/lz-string@1.5.0/libs/lz-string.min.js';

  function loadScript(url,cb){
    if(url===QRCDN&&window.QRCode){cb&&cb();return;}
    if(url===LZS&&window.LZString){cb&&cb();return;}
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

  function uploadToGist(cb){
    var data=localStorage.getItem('med_main')||'[]';
    fetch('https://api.github.com/gists',{
      method:'POST',
      headers:{'Content-Type':'application/json','Accept':'application/vnd.github+json'},
      body:JSON.stringify({description:'医療事務メモ帳 同期',public:false,
        files:{'医療メモ.json':{content:data}}
      })
    })
    .then(function(r){return r.json();})
    .then(function(j){
      if(j.id)cb(j.id,null);
      else cb(null,'アップロード失敗');
    })
    .catch(function(e){cb(null,e.message||'通信エラー');});
  }

  function fetchFromGist(gistId,cb){
    fetch('https://api.github.com/gists/'+gistId,{
      headers:{'Accept':'application/vnd.github+json'}
    })
    .then(function(r){return r.json();})
    .then(function(j){
      var files=j.files;
      if(!files){cb(null,'データが見つかりません');return;}
      var key=Object.keys(files)[0];
      var content=files[key].content;
      try{var d=JSON.parse(content);cb(d,null);}
      catch(e){cb(null,'パースエラー');}
    })
    .catch(function(e){cb(null,e.message||'通信エラー');});
  }

  function checkSyncHash(){
    var h=location.hash;
    if(h.indexOf('#gist=')===0){
      var gistId=h.slice(6);
      history.replaceState(null,'',location.pathname);
      fetchFromGist(gistId,function(d,err){
        if(err){alert('同期エラー: '+err);return;}
        if(Array.isArray(d)&&confirm(d.length+'件のメモを同期しますか? 現在のデータは上書きされます')){
          localStorage.setItem('med_main',JSON.stringify(d));
          location.reload();
        }
      });
      return;
    }
    if(h.indexOf('#sync=')!==0)return;
    try{
      var encoded=h.slice(6);
      var json=null;
      if(window.LZString){json=LZString.decompressFromEncodedURIComponent(encoded);}
      if(!json){try{json=decodeURIComponent(atob(encoded));}catch(e2){}}
      var d2=JSON.parse(json);
      if(Array.isArray(d2)&&confirm(d2.length+'件のメモを同期しますか? 現在のデータは上書きされます')){
        localStorage.setItem('med_main',JSON.stringify(d2));
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
      '.qr-box p{margin:0 0 12px;color:#94a3b8;font-size:12px;line-height:1.6}'+
      '.qr-canvas{background:#fff;padding:10px;border-radius:8px;display:inline-block}'+
      '.qr-close{margin-top:14px;padding:9px 28px;background:#1e3a6e;border:1px solid #2d5aa0;'+
      'color:#e2e8f0;border-radius:8px;cursor:pointer;font-size:13px}'+
      '.qr-close:hover{background:#254d94}'+
      '.qr-spin{color:#93c5fd;font-size:13px;margin:16px 0}'+
      '.qr-note{font-size:11px;color:#64748b;margin-top:8px}';
    document.head.appendChild(s);

    var f=document.createElement('button');
    f.className='sfab';
    f.innerHTML='&#x1F504;';
    f.title='データ同期';

    var panel=document.createElement('div');
    panel.className='sp';
    panel.innerHTML='<h4>&#x1F4F1; デバイス間同期</h4>';

    function btn(t,fn){
      var b=document.createElement('button');
      b.textContent=t;b.onclick=fn;panel.appendChild(b);
    }

    btn('&#x1F4F7; QRコードで転送',function(){
      panel.classList.remove('o');
      loadScript(LZS,function(){loadScript(QRCDN,function(){showQR();});});
    });

    btn('&#x1F4CB; 同期URLをコピー',function(){
      loadScript(LZS,function(){
        var url=getSyncURL();
        navigator.clipboard.writeText(url)
          .then(function(){alert('✅ コピーしました!');});
      });
    });

    btn('&#x2B07;&#xFE0F; JSONエクスポート',function(){
      var blob=new Blob([localStorage.getItem('med_main')||'[]'],{type:'application/json'});
      var a=document.createElement('a');
      a.href=URL.createObjectURL(blob);
      a.download='memo-'+(new Date().toISOString().slice(0,10))+'.json';
      a.click();URL.revokeObjectURL(a.href);
    });

    btn('&#x2B06;&#xFE0F; JSONインポート',function(){
      var i=document.createElement('input');i.type='file';i.accept='.json';
      i.onchange=function(e){
        var fi=e.target.files[0];if(!fi)return;
        var r=new FileReader();
        r.onload=function(ev){
          try{
            var d=JSON.parse(ev.target.result);
            if(Array.isArray(d)&&confirm(d.length+'件読み込みます。現在のデータは上書きされます')){
              localStorage.setItem('med_main',JSON.stringify(d));location.reload();
            }
          }catch(e){alert('ファイルが正しくありません');}
        };r.readAsText(fi);
      };i.click();
    });

    function makeOverlay(){
      var o=document.createElement('div');o.className='qr-overlay';
      o.onclick=function(e){if(e.target===o)document.body.removeChild(o);};
      return o;
    }

    function showQR(){
      var count=0;
      try{count=JSON.parse(localStorage.getItem('med_main')||'[]').length;}catch(e){}
      loadScript(LZS,function(){
        var url=getSyncURL();
        if(url.length<=2500){
          renderQROverlay(url,count,false);
        }else{
          var o=makeOverlay();
          o.innerHTML='<div class="qr-box"><h3>&#x1F4E4; アップロード中...</h3>'+
            '<div class="qr-spin">メモ '+count+'件をGitHub Gistに保存中</div>'+
            '<p class="qr-note">Wi-Fi環境では数秒かかる場合があります</p></div>';
          document.body.appendChild(o);
          uploadToGist(function(gistId,err){
            document.body.removeChild(o);
            if(err){
              alert('アップロード失敗: '+err+'\n\nJSONエクスポート/インポートをお使いください');
              return;
            }
            var gistUrl=location.origin+location.pathname+'#gist='+gistId;
            renderQROverlay(gistUrl,count,true);
          });
        }
      });
    }

    function renderQROverlay(url,count,isGist){
      var o=makeOverlay();
      var note=isGist?'GitHub Gist経由 (クラウドに一時保存)':'直接転送';
      o.innerHTML='<div class="qr-box">'+
        '<h3>&#x1F4F7; QRコードをスキャン</h3>'+
        '<p>スマホのカメラで読み取ると<br>メモ '+count+'件が同期されます</p>'+
        '<div class="qr-canvas" id="qr-render"></div>'+
        '<p class="qr-note">'+note+'</p>'+
        '<br><button class="qr-close">閃じる</button></div>';
      o.querySelector('.qr-close').onclick=function(){document.body.removeChild(o);};
      document.body.appendChild(o);
      try{
        new QRCode(document.getElementById('qr-render'),{
          text:url,width:200,height:200,
          colorDark:'#000000',colorLight:'#ffffff',
          correctLevel:QRCode.CorrectLevel.M
        });
      }catch(e){
        document.getElementById('qr-render').innerHTML='<p style="color:red">QR生成失敗</p>';
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
