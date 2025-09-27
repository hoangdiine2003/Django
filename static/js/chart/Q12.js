// Q12: Tong chi tieu moi khach hang
function renderQ12(containerId, dataset){
  const container = d3.select(containerId);
  container.selectAll('*').remove();
  const legend = d3.select('#legend');
  legend.selectAll('*').remove();

  if(!Array.isArray(dataset) || dataset.length === 0){
    container.append('div').attr('class','empty-message').text('Khong co du lieu');
    return;
  }

  const normalized = dataset
    .map(d => ({
      total_spent: +d.total_spent || 0,
    }))
    .filter(d => d.total_spent >= 0);

  if(normalized.length === 0){
    container.append('div').attr('class','empty-message').text('Khong co du lieu hop le');
    return;
  }

  const values = normalized.map(d => d.total_spent).sort((a, b) => a - b);
  const totalCustomers = normalized.length;
  const totalSpent = d3.sum(values);
  const averageSpent = totalCustomers ? totalSpent / totalCustomers : 0;
  const medianSpent = d3.median(values) || 0;
  const currencyTick = value => {
    if(value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}B`;
    if(value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
    if(value >= 1_000) return `${Math.round(value / 1_000)}K`;
    return `${Math.round(value)}`;
  };

  const step = 50_000;
  const maxValue = d3.max(values) || 0;
  const binCount = Math.max(1, Math.ceil((maxValue + step) / step));
  const bins = Array.from({length: binCount}, (_, i) => ({
    x0: i * step,
    x1: (i + 1) * step,
    count: 0,
  }));

  values.forEach(value => {
    const index = Math.min(Math.floor(value / step), bins.length - 1);
    bins[index].count += 1;
  });

  const margin = {top: 30, right: 80, bottom: 70, left: 90};
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

  const x = d3.scaleLinear()
    .domain([0, binCount * step])
    .range([0, width])
    .nice();

  const yMax = d3.max(bins, d => d.count) || 0;
  const y = d3.scaleLinear()
    .domain([0, yMax * 1.1])
    .range([height, 0])
    .nice();

  svg.append('g')
    .attr('class','grid')
    .call(d3.axisLeft(y).ticks(6).tickSize(-width).tickFormat(() => ''))
    .selectAll('line')
    .attr('stroke', '#ecf0f1');

  svg.append('g')
    .attr('class','axis y-axis')
    .call(d3.axisLeft(y).ticks(6).tickFormat(d => numberFormat(d)))
    .selectAll('text')
    .style('font-size','12px');

  svg.append('g')
    .attr('class','axis x-axis')
    .attr('transform', `translate(0, ${height})`)
    .call(d3.axisBottom(x).ticks(10).tickFormat(currencyTick))
    .selectAll('text')
    .style('font-size','12px');

  d3.selectAll('body > .tooltip').remove();
  const tooltip = d3.select('body').append('div').attr('class','tooltip').style('opacity',0);

  svg.selectAll('.bar')
    .data(bins)
    .enter()
    .append('rect')
    .attr('class','bar')
    .attr('x', d => x(d.x0))
    .attr('y', d => y(d.count))
    .attr('width', d => Math.max(1, x(d.x1) - x(d.x0) - 1))
    .attr('height', d => height - y(d.count))
    .attr('fill', '#20bf6b')
    .attr('opacity', 0.85)
    .on('mousemove', (event, d) => {
      const rangeLabel = `${currencyTick(d.x0)} - ${currencyTick(d.x1)}`;
      showTooltip(tooltip, `<strong>${rangeLabel}</strong><br>${numberFormat(d.count)} khach`, event);
    })
    .on('mouseleave', () => hideTooltip(tooltip));

  svgRoot.append('text')
    .attr('class','chart-title')
    .attr('x', containerWidth / 2)
    .attr('y', 24)
    .attr('text-anchor','middle')
    .style('font-size','18px')
    .style('font-weight','600')
    .text(`Phân phối chi tiêu của khách hàng`);

  svg.append('text')
    .attr('x', -60)
    .attr('y', -16)
    .attr('text-anchor','start')
    .style('font-size','12px')
    .style('fill','#7f8c8d')
    .text('So khach hang');

  svg.append('text')
    .attr('x', width)
    .attr('y', height + 48)
    .attr('text-anchor','end')
    .style('font-size','12px')
    .style('fill','#7f8c8d')
    .text('Tong chi tieu (dong)');
}
