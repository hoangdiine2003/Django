// Common utility functions
const numberFormat = d3.format(",.0f");
const currencyFormat = d3.format(",.0f");

function formatMillions(value){
  if(value >= 1_000_000){
    return (value/1_000_000).toFixed(1) + 'M';
  }
  if(value >= 1000){
    return numberFormat(value);
  }
  return value;
}

function showTooltip(tooltip, html, event){
  tooltip
    .html(html)
    .style('opacity',1)
    .style('left', (event.pageX + 15) + 'px')
    .style('top', (event.pageY + 10) + 'px');
}
function hideTooltip(tooltip){ tooltip.style('opacity',0); }

const CATEGORY_COLOR_MAP = {
  'Bột': '#1abc9c',
  'Trà hoa': '#e74c3c',
  'Trà củ, quả sấy': '#95a5a6',
  'Trà mix': '#f1c40f',
  'Set trà': '#e67e22'
};

function colorByCategory(name){ return CATEGORY_COLOR_MAP[name] || '#3498db'; }
