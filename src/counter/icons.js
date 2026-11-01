// Small local icon renderer compatible with the counter's existing UI calls.
const counterIconPaths={
 activity:'M3 12h4l3-8 4 16 3-8h4',mic:'M9 4a3 3 0 0 1 6 0v7a3 3 0 0 1-6 0Z M5 10v1a7 7 0 0 0 14 0v-1 M12 18v4 M8 22h8',
 'volume-2':'M3 9h4l5-4v14l-5-4H3Z M16 8a6 6 0 0 1 0 8 M19 5a10 10 0 0 1 0 14','volume-x':'M3 9h4l5-4v14l-5-4H3Z M17 9l5 6 M22 9l-5 6',
 history:'M3 11a9 9 0 1 1 2 7 M3 4v7h7 M12 7v5l3 2',plus:'M12 5v14 M5 12h14',play:'M7 4l14 8-14 8Z',pause:'M7 4v16 M17 4v16',
 'undo-2':'M3 8h10a7 7 0 0 1 0 14 M3 8l5-5 M3 8l5 5','rotate-ccw':'M3 11a9 9 0 1 1 2 7 M3 4v7h7',
 gauge:'M4 18a9 9 0 1 1 16 0 M12 14l5-6',trophy:'M7 3h10v6a5 5 0 0 1-10 0Z M7 5H3v3a4 4 0 0 0 4 4 M17 5h4v3a4 4 0 0 1-4 4 M12 14v7 M8 21h8',x:'M6 6l12 12 M18 6 6 18',sun:'M12 8a4 4 0 1 1 0 8 4 4 0 0 1 0-8 M12 2v2 M12 20v2 M2 12h2 M20 12h2 M5 5l2 2 M17 17l2 2 M19 5l-2 2 M7 17l-2 2'
};
const lucide={createIcons(){document.querySelectorAll('[data-lucide]').forEach(el=>{
 const name=el.getAttribute('data-lucide');let svg=el;
 if(el.tagName.toLowerCase()!=='svg'){svg=document.createElementNS('http://www.w3.org/2000/svg','svg');for(const a of el.attributes)svg.setAttribute(a.name,a.value);el.replaceWith(svg)}
 svg.setAttribute('viewBox','0 0 24 24');svg.setAttribute('fill','none');svg.setAttribute('stroke','currentColor');svg.setAttribute('stroke-width','2');svg.setAttribute('stroke-linecap','round');svg.setAttribute('stroke-linejoin','round');svg.setAttribute('aria-hidden','true');
 svg.innerHTML=`<path d="${counterIconPaths[name]||counterIconPaths.activity}"/>`;
})}};
