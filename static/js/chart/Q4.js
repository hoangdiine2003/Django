// Q4: Doanh số trung bình theo ngày trong tuần
function renderQ4(containerId, dataset){
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
      weekday: typeof d.weekday === 'number' ? d.weekday : parseInt(d.weekday, 10),
      weekday_label: d.weekday_label || `Thứ ${d.weekday}`,
      avg_revenue: +d.avg_revenue || 0,
      avg_quantity: +d.avg_quantity || 0,
      days_sampled: +d.days_sampled || 0
    }))
    .filter(d => Number.isFinite(d.weekday));

  if(normalized.length === 0){
    container.append('div').attr('class','empty-message').text('Không có dữ liệu');
    return;
  }

  const sorted = [...normalized].sort((a, b) => a.weekday - b.weekday);
  const best = sorted.reduce((acc, cur) => cur.avg_revenue > acc.avg_revenue ? cur : acc, sorted[0]);
  const worst = sorted.reduce((acc, cur) => cur.avg_revenue < acc.avg_revenue ? cur : acc, sorted[0]);

  const qtyFormat = d3.format(',.1f');

  const summary = container.append('div').attr('class','summary-container');
  summary.append('div')
    .attr('class','summary-card best')
    .html(`<strong>Ngày tốt nhất: ${best.weekday_label}</strong><span>Doanh thu TB ${currencyFormat(best.avg_revenue)} VNĐ</span><span>Số lượng TB ${qtyFormat(best.avg_quantity)}</span><span></span>`);
  summary.append('div')
    .attr('class','summary-card worst')
    .html(`<strong>Ngày thấp nhất: ${worst.weekday_label}</strong><span>Doanh thu TB ${currencyFormat(worst.avg_revenue)} VNĐ</span><span>Số lượng TB ${qtyFormat(worst.avg_quantity)}</span><span></span>`);

  legend.append('div')
    .attr('class','legend-item')
    .html(`<span class="legend-color" style="background:#27ae60"></span><span>Ngày tốt nhất</span>`);
  legend.append('div')
    .attr('class','legend-item')
    .html(`<span class="legend-color" style="background:#95a5a6"></span><span>Ngày thấp nhất</span>`);

  const margin = {top: 20, right: 30, bottom: 70, left: 110};
  const chartWidth = Math.max(container.node().getBoundingClientRect().width, 620) - margin.left - margin.right;
  const chartHeight = 380;

  const svg = container.append('svg')
    .attr('width', chartWidth + margin.left + margin.right)
    .attr('height', chartHeight + margin.top + margin.bottom)
    .append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);

  const x = d3.scaleBand()
    .domain(sorted.map(d => d.weekday_label))
    .range([0, chartWidth])
    .padding(0.35);

  const y = d3.scaleLinear()
    .domain([0, d3.max(sorted, d => d.avg_revenue)])
    .nice()
    .range([chartHeight, 0]);

  const palette = {
    0: '#1f77b4',
    1: '#ff7f0e',
    2: '#2ca02c',
    3: '#d62728',
    4: '#9467bd',
    5: '#8c564b',
    6: '#e377c2'
  };

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
    .data(sorted)
    .enter()
    .append('rect')
    .attr('class','bar fade-in')
    .attr('x', d => x(d.weekday_label))
    .attr('y', d => y(d.avg_revenue))
    .attr('width', x.bandwidth())
    .attr('height', d => chartHeight - y(d.avg_revenue))
    .attr('fill', d => {
      if(d.weekday === best.weekday) return '#27ae60';
      if(d.weekday === worst.weekday) return '#95a5a6';
      return palette[d.weekday] || '#3498db';
    })
    .on('mousemove', (event, d) => {
      showTooltip(tooltip,
        `<strong>${d.weekday_label}</strong><br>Doanh thu TB: ${currencyFormat(d.avg_revenue)} VNĐ<br>Số lượng TB: ${qtyFormat(d.avg_quantity)}<br>Số ngày: ${d.days_sampled}`,
        event);
    })
    .on('mouseleave', () => hideTooltip(tooltip));

  svg.selectAll('.value-label')
    .data(sorted)
    .enter()
    .append('text')
    .attr('class','bar-label')
    .attr('x', d => x(d.weekday_label) + x.bandwidth()/2)
    .attr('y', d => y(d.avg_revenue) - 6)
    .attr('text-anchor','middle')
    .style('font-weight','700')
    .text(d => formatMillions(d.avg_revenue));

  svg.append('text')
    .attr('class','chart-title')
    .attr('x', chartWidth / 2)
    .attr('y', -10)
    .attr('text-anchor','middle')
    .style('font-size','18px')
    .style('font-weight','600')
    .text('Doanh thu trung bình theo ngày trong tuần');
}
