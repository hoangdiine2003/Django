// Q3: Doanh số bán hàng theo tháng (sử dụng dữ liệu tổng hợp từ API)
function renderQ3(containerId, dataset){
  const container = d3.select(containerId);
  container.selectAll('*').remove();
  d3.select('#legend').selectAll('*').remove();

  if(!dataset || dataset.length === 0){
    container.append('div').attr('class','empty-message').text('Không có dữ liệu');
    return;
  }

  const normalized = dataset.map(d => ({
    month: typeof d.month === 'number' ? d.month : parseInt(d.month, 10) || 0,
    month_label: d.month_label || `T${String(d.month).padStart(2,'0')}`,
    total_revenue: +d.total_revenue || 0,
    total_quantity: +d.total_quantity || 0
  }));

  const sortedByMonth = [...normalized].sort((a,b)=> a.month - b.month);

  const best = normalized.reduce((acc, cur)=> cur.total_revenue > acc.total_revenue ? cur : acc, normalized[0]);
  const worst = normalized.reduce((acc, cur)=> cur.total_revenue < acc.total_revenue ? cur : acc, normalized[0]);

  const summary = container.append('div').attr('class','summary-container');
  summary.append('div')
    .attr('class','summary-card best')
    .html(`<strong>Tháng cao nhất: ${best.month_label}</strong><span>Doanh thu ${currencyFormat(best.total_revenue)} VNĐ</span><span>Số lượng ${numberFormat(best.total_quantity)}</span>`);
  summary.append('div')
    .attr('class','summary-card worst')
    .html(`<strong>Tháng thấp nhất: ${worst.month_label}</strong><span>Doanh thu ${currencyFormat(worst.total_revenue)} VNĐ</span><span>Số lượng ${numberFormat(worst.total_quantity)}</span>`);

  const margin = {top: 30, right: 30, bottom: 70, left: 90};
  const chartWidth = Math.max(container.node().getBoundingClientRect().width, 640) - margin.left - margin.right;
  const chartHeight = 420;

  const svg = container.append('svg')
    .attr('width', chartWidth + margin.left + margin.right)
    .attr('height', chartHeight + margin.top + margin.bottom)
    .append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);

  const x = d3.scaleBand()
    .domain(sortedByMonth.map(d => d.month_label))
    .range([0, chartWidth])
    .padding(0.25);

  const y = d3.scaleLinear()
    .domain([0, d3.max(sortedByMonth, d => d.total_revenue)])
    .nice()
    .range([chartHeight, 0]);

  const color = d3.scaleSequential()
    .domain([0, sortedByMonth.length - 1])
    .interpolator(d3.interpolateYlGnBu);

  const tooltip = d3.select('body').append('div').attr('class','tooltip').style('opacity',0);

  svg.append('g')
    .attr('class','axis x-axis')
    .attr('transform', `translate(0, ${chartHeight})`)
    .call(d3.axisBottom(x))
    .selectAll('text')
    .style('font-size','13px');

  svg.append('g')
    .attr('class','axis y-axis')
    .call(d3.axisLeft(y).ticks(8).tickFormat(d => formatMillions(d)))
    .selectAll('text')
    .style('font-size','13px');

  svg.selectAll('.bar')
    .data(sortedByMonth)
    .enter()
    .append('rect')
    .attr('class','bar fade-in')
    .attr('x', d => x(d.month_label))
    .attr('y', d => y(d.total_revenue))
    .attr('width', x.bandwidth())
    .attr('height', d => chartHeight - y(d.total_revenue))
    .attr('fill', (d, i) => {
      if(d.month === best.month) return '#f39c12';
      if(d.month === worst.month) return '#95a5a6';
      return color(i);
    })
    .on('mousemove', (event, d) => {
      showTooltip(tooltip,
        `<strong>${d.month_label}</strong><br>Doanh thu: ${currencyFormat(d.total_revenue)} VNĐ<br>Số lượng: ${numberFormat(d.total_quantity)}`,
        event);
    })
    .on('mouseleave', () => hideTooltip(tooltip));

  svg.selectAll('.value-label')
    .data(sortedByMonth)
    .enter()
    .append('text')
    .attr('class','bar-label')
    .attr('x', d => x(d.month_label) + x.bandwidth()/2)
    .attr('y', d => y(d.total_revenue) - 6)
    .attr('text-anchor','middle')
    .style('font-weight','700')
    .text(d => formatMillions(d.total_revenue));

  svg.append('text')
    .attr('class','chart-title')
    .attr('x', chartWidth / 2)
    .attr('y', -10)
    .attr('text-anchor','middle')
    .style('font-size','18px')
    .style('font-weight','600')
    .text('Doanh thu bán hàng theo tháng');
}
