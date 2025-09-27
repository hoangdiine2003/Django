// Q11: Phan phoi so lan mua hang theo khach hang
function renderQ11(containerId, dataset){
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
      purchase_count: +d.purchase_count || 0,
      customer_count: +d.customer_count || 0,
      share: +d.share || 0,
      cumulative_share: +d.cumulative_share || 0,
      total_customers: +d.total_customers || 0,
    }))
    .filter(d => d.purchase_count >= 0);

  if(normalized.length === 0){
    container.append('div').attr('class','empty-message').text('Khong co du lieu hop le');
    return;
  }

  normalized.sort((a, b) => a.purchase_count - b.purchase_count);

  const totalCustomers = normalized[0].total_customers || d3.sum(normalized, d => d.customer_count);
  const percentFormat = d3.format('.1f');
  const numberFormatLocal = d3.format(',');

  const margin = {top: 30, right: 50, bottom: 70, left: 90};
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

  const x = d3.scaleBand()
    .domain(normalized.map(d => d.purchase_count))
    .range([0, width])
    .padding(0.3);

  const maxCustomers = d3.max(normalized, d => d.customer_count) || 0;
  const y = d3.scaleLinear()
    .domain([0, maxCustomers * 1.1])
    .range([height, 0])
    .nice();

  svg.append('g')
    .attr('class','grid')
    .call(d3.axisLeft(y).ticks(6).tickSize(-width).tickFormat(() => ''))
    .selectAll('line')
    .attr('stroke', '#ecf0f1');

  svg.append('g')
    .attr('class','axis y-axis')
    .call(d3.axisLeft(y).ticks(6).tickFormat(d => numberFormatLocal(d)))
    .selectAll('text')
    .style('font-size','12px');

  svg.append('g')
    .attr('class','axis x-axis')
    .attr('transform', `translate(0, ${height})`)
    .call(d3.axisBottom(x))
    .selectAll('text')
    .style('font-size','12px');

  d3.selectAll('body > .tooltip').remove();
  const tooltip = d3.select('body').append('div').attr('class','tooltip').style('opacity',0);

  svg.selectAll('.bar')
    .data(normalized)
    .enter()
    .append('rect')
    .attr('class','bar')
    .attr('x', d => x(d.purchase_count))
    .attr('y', d => y(d.customer_count))
    .attr('width', x.bandwidth())
    .attr('height', d => height - y(d.customer_count))
    .attr('fill', '#54a0ff')
    .attr('opacity', 0.88)
    .on('mousemove', (event, d) => {
      showTooltip(tooltip,
        `<strong>${d.purchase_count} don</strong><br>${numberFormatLocal(d.customer_count)} khach (${percentFormat(d.share)}%)<br>Tich luy: ${percentFormat(d.cumulative_share)}%`,
        event);
    })
    .on('mouseleave', () => hideTooltip(tooltip));

  svg.selectAll('.value-label')
    .data(normalized)
    .enter()
    .append('text')
    .attr('class','bar-label')
    .attr('x', d => x(d.purchase_count) + x.bandwidth() / 2)
    .attr('y', d => y(d.customer_count) - 6)
    .attr('text-anchor','middle')
    .style('font-size','11px')
    .style('font-weight','600')
    .text(d => d.customer_count > 0 ? numberFormatLocal(d.customer_count) : '');

  svgRoot.append('text')
    .attr('class','chart-title')
    .attr('x', containerWidth / 2)
    .attr('y', 24)
    .attr('text-anchor','middle')
    .style('font-size','18px')
    .style('font-weight','600')
    .text('Phâbn phối lượt nua của khách hàng');

  svg.append('text')
    .attr('x', -60)
    .attr('y', -16)
    .attr('text-anchor','start')
    .style('font-size','12px')
    .style('fill','#7f8c8d')
    .text('So khach hang');

  svg.append('text')
    .attr('x', width / 2)
    .attr('y', height + 48)
    .attr('text-anchor','middle')
    .style('font-size','12px')
    .style('fill','#7f8c8d')
    .text('So don / khach hang');
}
