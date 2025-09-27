// Q2: Doanh số bán hàng theo Nhóm hàng (descending)
function renderQ2(containerId, dataset){
  const container = d3.select(containerId);
  container.selectAll('*').remove();
  d3.select('#legend').selectAll('*').remove();
  if(!dataset || dataset.length === 0){
    container.append('div').attr('class','empty-message').text('Không có dữ liệu');
    return;
  }
  dataset = [...dataset].sort((a,b)=> b.total_revenue - a.total_revenue);
  const margin = {top: 60, right: 120, bottom: 60, left: 170};
  const containerRect = container.node().getBoundingClientRect();
  const containerWidth = (containerRect && containerRect.width ? containerRect.width : container.node().clientWidth) || 960;
  const width = containerWidth - margin.left - margin.right;
  const barHeight = 45;
  const height = dataset.length * barHeight + margin.top + margin.bottom;
  container.style('min-height', `${height}px`);

  const svgRoot = container.append('svg')
    .attr('viewBox', `0 0 ${containerWidth} ${height}`)
    .attr('preserveAspectRatio','xMidYMid meet')
    .style('width','100%')
    .style('height', `${height}px`);

  const svg = svgRoot.append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);

  const x = d3.scaleLinear().domain([0, d3.max(dataset, d => d.total_revenue)]).range([0, width]);
  const y = d3.scaleBand().domain(dataset.map(d => d.category_name)).range([0, dataset.length * barHeight]).padding(0.25);

  const tooltip = d3.select('body').append('div').attr('class','tooltip').style('opacity',0);

  svg.selectAll('.bar')
    .data(dataset)
    .enter().append('rect')
    .attr('class','bar fade-in')
    .attr('x',0)
    .attr('y', d=> y(d.category_name))
    .attr('height', y.bandwidth())
    .attr('width', d=> x(d.total_revenue))
    .attr('fill', d=> colorByCategory(d.category_name))
    .on('mousemove', (event,d)=>{
      showTooltip(tooltip, `<strong>${d.category_name}</strong><br>Doanh thu: ${currencyFormat(d.total_revenue)} VNĐ<br>Số lượng: ${d.total_quantity}`, event);
    })
    .on('mouseleave', ()=> hideTooltip(tooltip));

  // Value labels
  svg.selectAll('.value-label')
    .data(dataset)
    .enter().append('text')
    .attr('class','bar-label')
    .attr('x', d=> x(d.total_revenue) + 6)
    .attr('y', d=> y(d.category_name) + y.bandwidth()/2 + 4)
    .style('font-weight','600')
    .text(d=> formatMillions(d.total_revenue));

  svg.append('g')
    .attr('class','axis y-axis')
    .call(d3.axisLeft(y).tickSize(0))
    .selectAll('text')
    .style('font-size','14px')
    .style('fill','#2c3e50');

  svg.append('g')
    .attr('class','axis x-axis')
    .attr('transform', `translate(0, ${dataset.length * barHeight})`)
    .call(d3.axisBottom(x).ticks(6).tickFormat(d=> formatMillions(d)));

  svgRoot.append('text')
    .attr('class','chart-title')
    .attr('x', containerWidth / 2)
    .attr('y', 28)
    .attr('text-anchor','middle')
    .style('font-size','18px')
    .style('font-weight','600')
    .text('Doanh thu bán hàng theo nhóm hàng');
}
