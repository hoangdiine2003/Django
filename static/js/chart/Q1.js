// Q1: Doanh số bán hàng theo Mặt hàng (descending)
function renderQ1(containerId, dataset){
  const container = d3.select(containerId);
  container.selectAll('*').remove();
  d3.select('#legend').selectAll('*').remove();
  if(!dataset || dataset.length === 0){
    container.append('div').attr('class','empty-message').text('Không có dữ liệu');
    return;
  }

  // Data already sorted descending from API, but ensure.
  dataset = [...dataset].sort((a,b)=> b.total_revenue - a.total_revenue).slice(0,25);

  const margin = {top: 50, right: 120, bottom: 40, left: 320};
  const containerRect = container.node().getBoundingClientRect();
  const containerWidth = (containerRect && containerRect.width ? containerRect.width : container.node().clientWidth) || 960;
  const width = containerWidth - margin.left - margin.right;
  const height = dataset.length * 32 + margin.top + margin.bottom;
  container.style('min-height', `${height}px`);

  const svgRoot = container.append('svg')
      .attr('viewBox', `0 0 ${containerWidth} ${height}`)
      .attr('preserveAspectRatio','xMidYMid meet')
      .style('width','100%')
      .style('height', `${height}px`);

  const svg = svgRoot.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

  const x = d3.scaleLinear()
      .domain([0, d3.max(dataset, d=> d.total_revenue)])
      .range([0, width]);

  const y = d3.scaleBand()
      .domain(dataset.map(d=> d.product_code + ' ' + d.product_name))
      .range([0, dataset.length * 32])
      .padding(0.25);

  const tooltip = d3.select('body').append('div').attr('class','tooltip').style('opacity',0);

  svg.selectAll('.bar')
     .data(dataset)
     .enter()
     .append('rect')
     .attr('class','bar fade-in')
     .attr('x',0)
     .attr('y', d=> y(d.product_code + ' ' + d.product_name))
     .attr('height', y.bandwidth())
     .attr('width', d=> x(d.total_revenue))
     .attr('fill', d=> colorByCategory(d.category_name))
     .on('mousemove', (event,d)=> {
        showTooltip(tooltip, `<strong>${d.product_code}</strong><br>${d.product_name}<br>Nhóm: ${d.category_name}<br>Doanh thu: ${currencyFormat(d.total_revenue)} VNĐ<br>Số lượng: ${d.total_quantity}`, event);
     })
     .on('mouseleave', ()=> hideTooltip(tooltip));

  // Labels value at end of bar
  svg.selectAll('.value-label')
     .data(dataset)
     .enter().append('text')
     .attr('class','bar-label')
     .attr('x', d=> x(d.total_revenue) + 6)
     .attr('y', d=> y(d.product_code + ' ' + d.product_name) + y.bandwidth()/2 + 4)
     .style('font-weight','600')
     .text(d=> formatMillions(d.total_revenue));

  // Y axis labels
  svg.append('g')
     .attr('class','axis y-axis')
     .call(d3.axisLeft(y).tickSize(0))
     .selectAll('text')
     .style('font-size','12px')
     .style('fill','#2c3e50')
     .call(wrapText, 300);

  svg.append('g')
     .attr('class','axis x-axis')
     .attr('transform', `translate(0, ${dataset.length * 32})`)
     .call(d3.axisBottom(x).ticks(6).tickFormat(d=> formatMillions(d)))
     .selectAll('text').style('font-size','12px');

  svgRoot.append('text')
      .attr('class','chart-title')
      .attr('x', containerWidth / 2)
      .attr('y', 24)
      .attr('text-anchor','middle')
      .style('font-size','18px')
      .style('font-weight','600')
      .text('Doanh thu bán hàng theo Mặt hàng');

  function wrapText(text, width){
    text.each(function(){
      const text = d3.select(this);
      const words = text.text().split(/\s+/).reverse();
      let line = [], lineNumber = 0, lineHeight = 1.1, y = text.attr('y'), dy = parseFloat(text.attr('dy')) || 0;
      let tspan = text.text(null).append('tspan').attr('x', -10).attr('y', y).attr('dy', dy + 'em');
      let word;
      while(word = words.pop()){
        line.push(word);
        tspan.text(line.join(' '));
        if(tspan.node().getComputedTextLength() > width){
          line.pop();
          tspan.text(line.join(' '));
          line = [word];
          tspan = text.append('tspan').attr('x', -10).attr('y', y).attr('dy', ++lineNumber * lineHeight + dy + 'em').text(word);
        }
      }
    });
  }
}
