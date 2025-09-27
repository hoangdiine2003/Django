// Q7: Xác suất bán hàng theo nhóm hàng (tỷ lệ số đơn có xuất hiện nhóm hàng)
function renderQ7(containerId, dataset){
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
      category_name: d.category_name || 'Không xác định',
      order_count: +d.order_count || 0,
      probability: +d.probability || 0
    }));

  if(normalized.length === 0){
    container.append('div').attr('class','empty-message').text('Không có dữ liệu');
    return;
  }

  const sorted = [...normalized].sort((a, b) => b.probability - a.probability);
  const best = sorted[0];
  const worst = sorted[sorted.length - 1];

  const percentFormat = d3.format('.1f');

  const summary = container.append('div').attr('class','summary-container');
  summary.append('div')
    .attr('class','summary-card best')
    .html(`<strong>Nhóm dễ bán nhất: ${best.category_name}</strong><span>Xác suất ${percentFormat(best.probability)}%</span><span>Số đơn có nhóm: ${best.order_count}</span>`);
  summary.append('div')
    .attr('class','summary-card worst')
    .html(`<strong>Nhóm khó bán nhất: ${worst.category_name}</strong><span>Xác suất ${percentFormat(worst.probability)}%</span><span>Số đơn có nhóm: ${worst.order_count}</span>`);

  legend.append('div')
    .attr('class','legend-item')
    .html(`<span class="legend-color" style="background:#27ae60"></span><span>Dễ bán nhất</span>`);
  legend.append('div')
    .attr('class','legend-item')
    .html(`<span class="legend-color" style="background:#e74c3c"></span><span>Khó bán nhất</span>`);

  const margin = {top: 70, right: 120, bottom: 80, left: 280};
  const containerRect = container.node().getBoundingClientRect();
  const containerWidth = (containerRect && containerRect.width ? containerRect.width : container.node().clientWidth) || 1040;
  const width = containerWidth - margin.left - margin.right;
  const barHeight = 48;
  const chartHeight = sorted.length * barHeight;

  container.style('min-height', `${chartHeight + margin.top + margin.bottom}px`);

  const svgRoot = container.append('svg')
    .attr('viewBox', `0 0 ${containerWidth} ${chartHeight + margin.top + margin.bottom}`)
    .attr('preserveAspectRatio','xMidYMid meet')
    .style('width','100%')
    .style('height', `${chartHeight + margin.top + margin.bottom}px`);

  const svg = svgRoot.append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);

  const x = d3.scaleLinear()
    .domain([0, d3.max(sorted, d => d.probability)])
    .nice()
    .range([0, width]);

  const y = d3.scaleBand()
    .domain(sorted.map(d => d.category_name))
    .range([0, chartHeight])
    .padding(0.25);

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
    .call(d3.axisLeft(y).tickSize(0))
    .selectAll('text')
    .style('font-size','13px')
    .style('fill','#2c3e50');

  svg.append('g')
    .attr('class','axis x-axis')
    .attr('transform', `translate(0, ${chartHeight})`)
    .call(d3.axisBottom(x).ticks(6).tickFormat(d => `${percentFormat(d)}%`))
    .selectAll('text')
    .style('font-size','12px');

  svg.selectAll('.bar')
    .data(sorted)
    .enter()
    .append('rect')
    .attr('class','bar fade-in')
    .attr('x', 0)
    .attr('y', d => y(d.category_name))
    .attr('height', y.bandwidth())
    .attr('width', d => x(d.probability))
    .attr('fill', (d, i) => {
      if(d.category_name === best.category_name) return '#27ae60';
      if(d.category_name === worst.category_name) return '#e74c3c';
      return colorForIndex(i);
    })
    .on('mousemove', (event, d) => {
      showTooltip(tooltip,
        `<strong>${d.category_name}</strong><br>Tỷ lệ đơn: ${percentFormat(d.probability)}%<br>Số đơn có nhóm: ${d.order_count}`,
        event);
    })
    .on('mouseleave', () => hideTooltip(tooltip));

  svg.selectAll('.value-label')
    .data(sorted)
    .enter()
    .append('text')
    .attr('class','bar-label')
    .attr('x', d => x(d.probability) + 6)
    .attr('y', d => y(d.category_name) + y.bandwidth() / 2 + 4)
    .style('font-weight','600')
    .text(d => `${percentFormat(d.probability)}%`);

  svgRoot.append('text')
    .attr('class','chart-title')
    .attr('x', containerWidth / 2)
    .attr('y', 36)
    .attr('text-anchor','middle')
    .style('font-size','18px')
    .style('font-weight','600')
    .text('Xác suất bán hàng theo nhóm hàng');
}
