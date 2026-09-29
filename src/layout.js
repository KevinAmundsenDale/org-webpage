// Layout preferences stay on this device and never modify topic content.
export function setupLayout({closeSearch}) {
  const toolbar=document.querySelector('#toolbar'),toggle=document.querySelector('#toolbar-toggle');
  const divider=document.querySelector('#sidebar-resize'),main=document.querySelector('main');
  const read=key=>{try{return localStorage.getItem(key);}catch{return null;}};
  const save=(key,value)=>{try{localStorage.setItem(key,String(value));}catch{}};
  const collapse=value=>{
    toolbar.hidden=value;toggle.setAttribute('aria-expanded',String(!value));
    toggle.textContent=value?'Vis meny':'Skjul meny';closeSearch();save('toolbar-collapsed',value);
  };
  collapse(read('toolbar-collapsed')==='true');
  toggle.onclick=()=>collapse(!toolbar.hidden);

  let requestedWidth=Number(read('sidebar-width'))||null,drag=null;
  const bounds=()=>{
    const width=main.getBoundingClientRect().width;
    const max=Math.max(0,width-(width<=700?24:280));
    return {min:Math.min(320,max),max};
  };
  const resize=()=>{
    const {min,max}=bounds(),value=Math.round(Math.max(min,Math.min(max,requestedWidth??(innerWidth>=1550?450:innerWidth<=1120?380:420))));
    main.style.setProperty('--sidebar-width',value+'px');
    divider.setAttribute('aria-valuemin',String(Math.round(min)));divider.setAttribute('aria-valuemax',String(Math.round(max)));
    divider.setAttribute('aria-valuenow',String(value));divider.setAttribute('aria-valuetext',value+' piksler');
  };
  const setWidth=value=>{const {min,max}=bounds();requestedWidth=Math.max(min,Math.min(max,value));resize();save('sidebar-width',requestedWidth);};
  divider.onpointerdown=e=>{
    if(e.button!==0)return;e.preventDefault();divider.focus();
    drag={id:e.pointerId,x:e.clientX,width:Number(divider.getAttribute('aria-valuenow'))};
    divider.setPointerCapture(e.pointerId);document.body.classList.add('resizing-sidebar');
  };
  divider.onpointermove=e=>{if(drag?.id===e.pointerId)setWidth(drag.width+drag.x-e.clientX);};
  const end=e=>{
    if(drag?.id!==e.pointerId)return;drag=null;document.body.classList.remove('resizing-sidebar');
    if(divider.hasPointerCapture(e.pointerId))divider.releasePointerCapture(e.pointerId);
  };
  divider.onpointerup=end;divider.onpointercancel=end;divider.onlostpointercapture=end;
  divider.onkeydown=e=>{
    const value=Number(divider.getAttribute('aria-valuenow')),{min,max}=bounds();
    if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();
    setWidth(e.key==='Home'?min:e.key==='End'?max:value+(e.key==='ArrowLeft'?24:-24));
  };
  new ResizeObserver(resize).observe(main);resize();
  return {expandToolbar:()=>collapse(false)};
}
