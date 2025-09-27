// Q9: Xac suat ban cua tung mat hang trong nhom hang
function renderQ9(containerId, dataset){
  const container = d3.select(containerId);
  container.selectAll('*').remove();
  const legend = d3.select('#legend');
  legend.selectAll('*').remove();

  if(!Array.isArray(dataset) || dataset.length === 0){
    container.append('div').attr('class','empty-message').text('Khong co du lieu');
    return;
  }

  const sanitized = dataset
    .map(d => ({
      category_id: d.category_id ?? null,
      category_name: d.category_name || 'Khong xac dinh',
      product_id: d.product_id ?? null,
      product_code: d.product_code || '',
      product_name: d.product_name || d.product_code || 'Khong ro ten',
      order_count: +d.order_count || 0,
      total_orders: +d.total_orders || 0,
      probability: +d.probability || 0,
    }))
    .filter(item => item.total_orders > 0);

  if(sanitized.length === 0){
    container.append('div').attr('class','empty-message').text('Khong co du lieu hop le');
    return;
  }

  container.append('h2')
    .attr('class','section-title')
    .text('Xác suất bán của từng mặt hàng trong nhóm hàng');

  const percentFormat = d3.format('.1f');
  const normalizeText = (value) => (value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

  const categoryPriority = (categoryName) => {
    const normalized = normalizeText(categoryName);
    if(normalized.includes('bot')) return 0;
    if(normalized.includes('set') && normalized.includes('tra')) return 1;
    if(normalized.includes('tra hoa')) return 2;
    if(normalized.includes('tra cu') || normalized.includes('qua say')) return 3;
    if(normalized.includes('tra mix')) return 4;
    return 5;
  };

  const grouped = Array.from(
    d3.group(sanitized, d => d.category_name),
    ([name, values]) => ({
      category: name,
      values: values.sort((a, b) => b.probability - a.probability),
      priority: categoryPriority(name)
    })
  ).sort((a, b) => {
    if(a.priority !== b.priority) return a.priority - b.priority;
    return a.category.localeCompare(b.category);
  });

  const palette = [
    '#20bf6b', '#f39c12', '#eb3b5a', '#3867d6', '#a55eea',
    '#0fb9b1', '#f7b731', '#ff6348', '#54a0ff', '#5f27cd',
    '#10ac84', '#ff9f43', '#ee5253', '#341f97', '#2e86de',
    '#01a3a4', '#ffb8b8', '#c8d6e5', '#1dd1a1', '#ff6f61'
  ];
  const colorMap = new Map();
  let colorIndex = 0;
  const colorForProduct = (item) => {
    const key = item.product_id ?? item.product_name;
    if(!colorMap.has(key)){
      const color = palette[colorIndex % palette.length];
      colorMap.set(key, color);
      colorIndex += 1;
    }
    return colorMap.get(key);
  };

  d3.selectAll('body > .tooltip').remove();
  const grid = container.append('div')
    .attr('class','multiples-grid q9-layout');

  const tooltip = d3.select('body').append('div')
    .attr('class','tooltip')
    .style('opacity',0);

  grouped.forEach(group => {
    const card = grid.append('div')
      .attr('class','category-panel');

    card.append('h3')
      .attr('class','panel-title')
      .text(group.category);

    const values = group.values;
    const margin = {top: 16, right: 70, bottom: 42, left: 200};
    const chartWidth = 520;
    const chartHeight = Math.max(values.length * 34, 120);

    const svg = card.append('svg')
      .attr('viewBox', `0 0 ${chartWidth + margin.left + margin.right} ${chartHeight + margin.top + margin.bottom}`)
      .attr('preserveAspectRatio','xMidYMid meet')
      .style('width','100%')
      .style('height', `${chartHeight + margin.top + margin.bottom}px`);

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const labels = values.map(v => v.product_name);
    const xMax = d3.max(values, d => d.probability) || 0;
    const domainMax = xMax <= 0 ? 1 : xMax * 1.05;
    const x = d3.scaleLinear()
      .domain([0, domainMax])
      .range([0, chartWidth])
      .nice();

    const y = d3.scaleBand()
      .domain(labels)
      .range([0, chartHeight])
      .padding(0.3);

    g.append('g')
      .attr('class','axis y-axis')
      .call(d3.axisLeft(y).tickSize(0))
      .selectAll('text')
      .style('font-size','12px');

    const tickCount = xMax > 60 ? 6 : (xMax > 30 ? 5 : 4);
    g.append('g')
      .attr('class','axis x-axis')
      .attr('transform', `translate(0, ${chartHeight})`)
      .call(d3.axisBottom(x).ticks(tickCount).tickFormat(d => `${percentFormat(d)}%`))
      .selectAll('text')
      .style('font-size','11px');

    g.selectAll('.bar')
      .data(values)
      .enter()
      .append('rect')
      .attr('class','bar')
      .attr('x', 0)
      .attr('y', d => y(d.product_name))
      .attr('height', y.bandwidth())
      .attr('width', d => x(d.probability))
      .attr('fill', d => colorForProduct(d))
      .attr('opacity', 0.9)
      .on('mousemove', (event, d) => {
        showTooltip(
          tooltip,
          `<strong>${d.product_name}</strong><br>${group.category}<br>Xac suat: ${percentFormat(d.probability)}%<br>Số đơn: ${numberFormat(d.order_count)} / ${numberFormat(d.total_orders)}`,
          event
        );
      })
      .on('mouseleave', () => hideTooltip(tooltip));

    g.selectAll('.value-label')
      .data(values)
      .enter()
      .append('text')
      .attr('class','bar-label')
      .attr('x', d => x(d.probability) + 8)
      .attr('y', d => y(d.product_name) + y.bandwidth() / 2 + 4)
      .style('font-weight','600')
      .style('font-size','12px')
      .text(d => `${percentFormat(d.probability)}%`);

    svg.append('text')
      .attr('x', margin.left)
      .attr('y', chartHeight + margin.top + margin.bottom - 8)
      .attr('text-anchor','start')
      .style('font-size','11px')
      .style('fill','#7f8c8d')
      .text('Xác suất (%)');
  });
}
