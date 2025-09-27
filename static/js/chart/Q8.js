// Q8: Xac suat ban theo nhom hang theo thang
function renderQ8(containerId, dataset){
  const container = d3.select(containerId);
  container.selectAll('*').remove();
  const legend = d3.select('#legend');
  legend.selectAll('*').remove();

  if(!dataset || dataset.length === 0){
    container.append('div').attr('class','empty-message').text('Khong co du lieu');
    return;
  }

  const normalized = dataset
    .map(d => {
      const rawMonth = typeof d.month === 'number' ? d.month : parseInt(d.month, 10);
      const month = Number.isFinite(rawMonth) ? rawMonth : null;
      const totalOrders = +d.total_orders || 0;
      return {
        month,
        month_label: d.month_label || (Number.isFinite(month) ? `T${String(month).padStart(2, '0')}` : 'N/A'),
        category_name: d.category_name || 'Khong xac dinh',
        order_count: +d.order_count || 0,
        total_orders: totalOrders,
        probability: +d.probability || 0,
      };
    })
    .filter(d => Number.isFinite(d.month) && d.month > 0 && d.total_orders > 0);

  if(normalized.length === 0){
    container.append('div').attr('class','empty-message').text('Khong co du lieu hop le');
    return;
  }

  const monthLabels = new Map();
  normalized.forEach(d => {
    if(!monthLabels.has(d.month)){
      monthLabels.set(d.month, d.month_label);
    }
  });

  const months = Array.from(monthLabels.keys()).sort((a, b) => a - b);
  if(months.length === 0){
    container.append('div').attr('class','empty-message').text('Khong co thang de hien thi');
    return;
  }

  const series = Array.from(d3.group(normalized, d => d.category_name), ([category, values]) => ({
    category,
    values: values.sort((a, b) => a.month - b.month)
  })).sort((a, b) => a.category.localeCompare(b.category));

  const percentFormat = d3.format('.1f');
  const bestPoint = normalized.reduce((acc, cur) => (cur.probability > acc.probability ? cur : acc), normalized[0]);
  const worstPoint = normalized.reduce((acc, cur) => (cur.probability < acc.probability ? cur : acc), normalized[0]);
  const avgProbability = d3.mean(normalized, d => d.probability) || 0;
  const maxTotalOrders = d3.max(normalized, d => d.total_orders) || 0;

  const summary = container.append('div').attr('class', 'summary-container');
  summary.append('div')
    .attr('class', 'summary-card best')
    .html(`<strong>Nhóm cao nhất: ${bestPoint.category_name}</strong><span>${bestPoint.month_label}: ${percentFormat(bestPoint.probability)}%</span><span>Số đơn: ${numberFormat(bestPoint.order_count)}</span>`);
  summary.append('div')
    .attr('class', 'summary-card worst')
    .html(`<strong>Nhóm thấp nhất: ${worstPoint.category_name}</strong><span>${worstPoint.month_label}: ${percentFormat(worstPoint.probability)}%</span><span>Số đơn: ${numberFormat(worstPoint.order_count)}</span>`);

  const margin = {top: 70, right: 160, bottom: 80, left: 80};
  const containerRect = container.node().getBoundingClientRect();
  const containerWidth = (containerRect && containerRect.width ? containerRect.width : container.node().clientWidth) || 960;
  const width = containerWidth - margin.left - margin.right;
  const height = 420;

  container.style('min-height', `${height + margin.top + margin.bottom}px`);

  const svgRoot = container.append('svg')
    .attr('viewBox', `0 0 ${containerWidth} ${height + margin.top + margin.bottom}`)
    .attr('preserveAspectRatio', 'xMidYMid meet')
    .style('width', '100%')
    .style('height', `${height + margin.top + margin.bottom}px`);

  const svg = svgRoot.append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);

  const x = d3.scalePoint()
    .domain(months)
    .range([0, width])
    .padding(0.5);

  const maxProbability = d3.max(normalized, d => d.probability) || 0;
  const yMax = maxProbability <= 0 ? 1 : maxProbability * 1.05;
  const y = d3.scaleLinear()
    .domain([0, yMax])
    .nice()
    .range([height, 0]);

  svg.append('g')
    .attr('class', 'grid')
    .call(d3.axisLeft(y).ticks(6).tickSize(-width).tickFormat(() => ''))
    .selectAll('line')
    .attr('stroke', '#ecf0f1');

  svg.append('g')
    .attr('class', 'axis y-axis')
    .call(d3.axisLeft(y).ticks(6).tickFormat(d => `${percentFormat(d)}%`))
    .selectAll('text')
    .style('font-size', '12px');

  svg.append('g')
    .attr('class', 'axis x-axis')
    .attr('transform', `translate(0, ${height})`)
    .call(d3.axisBottom(x).tickFormat(month => monthLabels.get(month) || `T${String(month).padStart(2, '0')}`))
    .selectAll('text')
    .style('font-size', '12px');

  const lineGenerator = d3.line()
    .defined(d => typeof d.probability === 'number')
    .x(d => x(d.month))
    .y(d => y(d.probability));

  const tooltip = d3.select('body').append('div').attr('class', 'tooltip').style('opacity', 0);

  const seriesGroup = svg.selectAll('.series')
    .data(series)
    .enter()
    .append('g')
    .attr('class', 'series');

  seriesGroup.append('path')
    .attr('class', 'line-path')
    .attr('fill', 'none')
    .attr('stroke-width', 2.5)
    .attr('stroke', d => colorByCategory(d.category))
    .attr('d', d => lineGenerator(d.values));

  seriesGroup.selectAll('.dot')
    .data(d => d.values)
    .enter()
    .append('circle')
    .attr('class', 'dot')
    .attr('cx', d => x(d.month))
    .attr('cy', d => y(d.probability))
    .attr('r', 4.5)
    .attr('fill', d => colorByCategory(d.category_name))
    .attr('stroke', '#fff')
    .attr('stroke-width', 1.5)
    .on('mousemove', (event, d) => {
      const label = monthLabels.get(d.month) || `T${String(d.month).padStart(2, '0')}`;
      showTooltip(
        tooltip,
        `<strong>${d.category_name}</strong><br>${label}: ${percentFormat(d.probability)}%<br>So don nhom: ${numberFormat(d.order_count)}<br>Tong don thang: ${numberFormat(d.total_orders)}`,
        event
      );
    })
    .on('mouseleave', () => hideTooltip(tooltip));

  svgRoot.append('text')
    .attr('class', 'chart-title')
    .attr('x', containerWidth / 2)
    .attr('y', 32)
    .attr('text-anchor', 'middle')
    .style('font-size', '18px')
    .style('font-weight', '600')
    .text('Xác suất bán từng nhóm hàng theo tháng');

  svg.append('text')
    .attr('x', -40)
    .attr('y', -16)
    .attr('text-anchor', 'end')
    .style('font-size', '12px')
    .style('fill', '#7f8c8d')
    .text('Xac suat (%)');

  legend.selectAll('.legend-item')
    .data(series)
    .enter()
    .append('div')
    .attr('class', 'legend-item')
    .html(d => `<span class="legend-color" style="background:${colorByCategory(d.category)}"></span><span>${d.category}</span>`);
}
