// Q5: Doanh số trung bình theo ngày trong tháng
function renderQ5(containerId, dataset){
  const container = d3.select(containerId);
  container.selectAll('*').remove();
  const legend = d3.select('#legend');
  legend.selectAll('*').remove();

  if(!dataset || dataset.length === 0){
    container.append('div').attr('class','empty-message').text('Không có dữ liệu');
    return;
  }

  const normalized = dataset
    .map(d => ({
      day: typeof d.day === 'number' ? d.day : parseInt(d.day, 10),
      day_label: d.day_label || `Ngày ${String(d.day).padStart(2,'0')}`,
      avg_revenue: +d.avg_revenue || 0,
      avg_quantity: +d.avg_quantity || 0,
      days_sampled: +d.days_sampled || 0
    }))
    .filter(d => Number.isFinite(d.day));

  if(normalized.length === 0){
    container.append('div').attr('class','empty-message').text('Không có dữ liệu');
    return;
  }

  const sorted = [...normalized].sort((a,b)=> a.day - b.day);
  const best = sorted.reduce((acc, cur)=> cur.avg_revenue > acc.avg_revenue ? cur : acc, sorted[0]);
  const worst = sorted.reduce((acc, cur)=> cur.avg_revenue < acc.avg_revenue ? cur : acc, sorted[0]);

  const qtyFormat = d3.format(',.1f');

  const summary = container.append('div').attr('class','summary-container');
  summary.append('div')
    .attr('class','summary-card best')
    .html(`<strong>Ngày tốt nhất: ${best.day_label}</strong><span>Doanh thu TB ${currencyFormat(best.avg_revenue)} VNĐ</span><span>Số lượng TB ${qtyFormat(best.avg_quantity)}</span>`);
  summary.append('div')
    .attr('class','summary-card worst')
    .html(`<strong>Ngày thấp nhất: ${worst.day_label}</strong><span>Doanh thu TB ${currencyFormat(worst.avg_revenue)} VNĐ</span><span>Số lượng TB ${qtyFormat(worst.avg_quantity)}</span>`);

  legend.append('div')
    .attr('class','legend-item')
    .html(`<span class="legend-color" style="background:#27ae60"></span><span>Ngày tốt nhất</span>`);
  legend.append('div')
    .attr('class','legend-item')
    .html(`<span class="legend-color" style="background:#95a5a6"></span><span>Ngày thấp nhất</span>`);

  const margin = {top: 70, right: 50, bottom: 110, left: 110};
  const containerRect = container.node().getBoundingClientRect();
  const containerWidth = (containerRect && containerRect.width ? containerRect.width : container.node().clientWidth) || 1120;
  const width = containerWidth - margin.left - margin.right;
  const chartHeight = 420;

  container.style('min-height', `${chartHeight + margin.top + margin.bottom}px`);

  const svgRoot = container.append('svg')
    .attr('viewBox', `0 0 ${containerWidth} ${chartHeight + margin.top + margin.bottom}`)
    .attr('preserveAspectRatio','xMidYMid meet')
    .style('width','100%')
    .style('height', `${chartHeight + margin.top + margin.bottom}px`);

  const svg = svgRoot.append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);

  const x = d3.scaleBand()
    .domain(sorted.map(d => d.day_label))
    .range([0, width])
    .padding(0.25);

  const y = d3.scaleLinear()
    .domain([0, d3.max(sorted, d => d.avg_revenue)])
    .nice()
    .range([chartHeight, 0]);

  const palette = [
    ...d3.schemeTableau10,
    ...d3.schemeSet3,
    ...d3.schemeSet2,
    ...d3.schemePastel1,
  ];

  const colorForIndex = index => palette[index % palette.length];

  const tooltip = d3.select('body').append('div').attr('class','tooltip').style('opacity',0);

  svg.append('g')
    .attr('class','axis y-axis')
    .call(d3.axisLeft(y).ticks(8).tickFormat(d => formatMillions(d)))
    .selectAll('text')
    .style('font-size','12px');

  svg.append('g')
    .attr('class','axis x-axis')
    .attr('transform', `translate(0, ${chartHeight})`)
    .call(d3.axisBottom(x))
    .selectAll('text')
    .style('font-size','12px')
    .attr('transform', sorted.length > 18 ? 'rotate(-35)' : null)
    .style('text-anchor', sorted.length > 18 ? 'end' : 'middle');

  svg.selectAll('.bar')
    .data(sorted)
    .enter()
    .append('rect')
    .attr('class','bar fade-in')
    .attr('x', d => x(d.day_label))
    .attr('y', d => y(d.avg_revenue))
    .attr('width', x.bandwidth())
    .attr('height', d => chartHeight - y(d.avg_revenue))
    .attr('fill', (d, i) => {
      if(d.day === best.day) return '#27ae60';
      if(d.day === worst.day) return '#95a5a6';
      return colorForIndex(i);
    })
    .on('mousemove', (event, d) => {
      showTooltip(tooltip,
        `<strong>${d.day_label}</strong><br>Doanh thu TB: ${currencyFormat(d.avg_revenue)} VNĐ<br>Số lượng TB: ${qtyFormat(d.avg_quantity)}<br>Số ngày: ${d.days_sampled}`,
        event);
    })
    .on('mouseleave', () => hideTooltip(tooltip));

  svg.selectAll('.value-label')
    .data(sorted)
    .enter()
    .append('text')
    .attr('class','bar-label')
    .attr('x', d => x(d.day_label) + x.bandwidth()/2)
    .attr('y', d => y(d.avg_revenue) - 8)
    .attr('text-anchor','middle')
    .style('font-weight','600')
    .text(d => formatMillions(d.avg_revenue));

  svgRoot.append('text')
    .attr('class','chart-title')
    .attr('x', containerWidth / 2)
    .attr('y', 36)
    .attr('text-anchor','middle')
    .style('font-size','18px')
    .style('font-weight','600')
    .text('Doanh thu trung bình theo ngày trong tháng');
}
