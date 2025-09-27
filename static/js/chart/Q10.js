// Q10: Xac suat ban cua tung mat hang theo thang trong tung nhom hang
function renderQ10(containerId, dataset){
  const container = d3.select(containerId);
  container.selectAll('*').remove();
  const legend = d3.select('#legend');
  legend.selectAll('*').remove();

  if(!Array.isArray(dataset) || dataset.length === 0){
    container.append('div').attr('class','empty-message').text('Khong co du lieu');
    return;
  }

  const normalized = dataset
    .map(d => {
      const rawMonth = typeof d.month === 'number' ? d.month : parseInt(d.month, 10);
      const month = Number.isFinite(rawMonth) ? rawMonth : null;
      return {
        month,
        month_label: d.month_label || (Number.isFinite(month) ? `T${String(month).padStart(2,'0')}` : 'N/A'),
        category_name: d.category_name || 'Khong xac dinh',
        product_name: d.product_name || d.product_code || 'Khong ro ten',
        product_code: d.product_code || '',
        probability: +d.probability || 0,
        order_count: +d.order_count || 0,
        total_orders: +d.total_orders || 0,
      };
    })
    .filter(d => Number.isFinite(d.month) && d.month > 0 && d.total_orders > 0);

  if(normalized.length === 0){
    container.append('div').attr('class','empty-message').text('Khong co du lieu hop le');
    return;
  }

  container.append('h2')
    .attr('class','section-title')
    .text('Xác suất bán của từng mặt hàng theo tháng trong từng nhóm hàng');

  const percentFormat = d3.format('.1f');

  const monthLabels = new Map();
  normalized.forEach(d => {
    if(!monthLabels.has(d.month)) monthLabels.set(d.month, d.month_label);
  });
  const months = Array.from(monthLabels.keys()).sort((a, b) => a - b);

  if(months.length === 0){
    container.append('div').attr('class','empty-message').text('Khong co thang de hien thi');
    return;
  }

  const grouped = Array.from(
    d3.group(normalized, d => d.category_name),
    ([category, values]) => ({ category, values })
  ).sort((a, b) => a.category.localeCompare(b.category));

  const grid = container.append('div')
    .attr('class','multiples-grid q10-layout');

  d3.selectAll('body > .tooltip').remove();
  const tooltip = d3.select('body').append('div').attr('class','tooltip').style('opacity',0);

  grouped.forEach(group => {
    const card = grid.append('div').attr('class','category-panel');
    card.append('h3')
      .attr('class','panel-title')
      .text(group.category);

    const series = Array.from(
      d3.group(group.values, v => v.product_name),
      ([product, values]) => ({
        product,
        values: values.sort((a, b) => a.month - b.month)
      })
    ).sort((a, b) => a.product.localeCompare(b.product));

    const margin = {top: 24, right: 90, bottom: 54, left: 80};
    const width = 420;
    const height = Math.max(220, series.length * 44);

    let [minProb, maxProb] = d3.extent(group.values, d => d.probability);
    if(!Number.isFinite(minProb)) minProb = 0;
    if(!Number.isFinite(maxProb)) maxProb = minProb;
    const span = maxProb - minProb;
    const padding = span === 0 ? Math.max(maxProb * 0.05, 2) : Math.max(span * 0.15, 2);
    const yMin = Math.max(0, minProb - padding);
    const yMax = maxProb + padding;

    const svgRoot = card.append('svg')
      .attr('viewBox', `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
      .attr('preserveAspectRatio','xMidYMid meet')
      .style('width','100%')
      .style('height', `${height + margin.top + margin.bottom}px`);

    const svg = svgRoot.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const x = d3.scalePoint()
      .domain(months)
      .range([0, width])
      .padding(0.5);

    const y = d3.scaleLinear()
      .domain([yMin, yMax])
      .nice()
      .range([height, 0]);

    const xAxis = d3.axisBottom(x)
      .tickFormat(month => monthLabels.get(month) || `T${String(month).padStart(2,'0')}`);

    const yAxis = d3.axisLeft(y)
      .ticks(6)
      .tickFormat(d => `${percentFormat(d)}%`);

    svg.append('g')
      .attr('class','grid')
      .call(d3.axisLeft(y).ticks(6).tickSize(-width).tickFormat(() => ''))
      .selectAll('line')
      .attr('stroke', '#ecf0f1');

    svg.append('g')
      .attr('class','axis y-axis')
      .call(yAxis)
      .selectAll('text')
      .style('font-size','11px');

    svg.append('g')
      .attr('class','axis x-axis')
      .attr('transform', `translate(0, ${height})`)
      .call(xAxis)
      .selectAll('text')
      .style('font-size','11px');

    const lineGenerator = d3.line()
      .defined(d => typeof d.probability === 'number' && monthLabels.has(d.month))
      .x(d => x(d.month))
      .y(d => y(d.probability));

    const palette = [
      ...d3.schemeTableau10,
      ...d3.schemeSet2,
      ...d3.schemeSet3,
    ];
    const color = d3.scaleOrdinal(palette).domain(series.map(s => s.product));

    const seriesGroup = svg.selectAll('.series')
      .data(series)
      .enter()
      .append('g')
      .attr('class','series');

    seriesGroup.append('path')
      .attr('class','line-path')
      .attr('fill','none')
      .attr('stroke-width', 2.5)
      .attr('stroke', d => color(d.product))
      .attr('d', d => lineGenerator(d.values));

    seriesGroup.selectAll('.dot')
      .data(d => d.values)
      .enter()
      .append('circle')
      .attr('class','dot')
      .attr('cx', d => x(d.month))
      .attr('cy', d => y(d.probability))
      .attr('r', 4)
      .attr('fill', d => color(d.product_name))
      .attr('stroke', '#fff')
      .attr('stroke-width', 1.4)
      .on('mousemove', (event, d) => {
        const label = monthLabels.get(d.month) || `T${String(d.month).padStart(2,'0')}`;
        showTooltip(
          tooltip,
          `<strong>${d.product_name}</strong><br>${group.category}<br>${label}: ${percentFormat(d.probability)}%<br>So don: ${numberFormat(d.order_count)} / ${numberFormat(d.total_orders)}`,
          event
        );
      })
      .on('mouseleave', () => hideTooltip(tooltip));

    svg.append('text')
      .attr('x', width)
      .attr('y', height + margin.bottom - 10)
      .attr('text-anchor','end')
      .style('font-size','11px')
      .style('fill','#7f8c8d')
      .text('Tháng');

    svg.append('text')
      .attr('x', -margin.left + 6)
      .attr('y', -12)
      .attr('text-anchor','start')
      .style('font-size','11px')
      .style('fill','#7f8c8d')
      .text('Xác suất (%)');
  });
}
