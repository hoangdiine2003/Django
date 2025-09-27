// App controller: tab logic + data fetching
function initializeApp(){
  const tabButtons = document.querySelectorAll('.tab-btn');
  const chartDiv = '#chart';

  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      tabButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const tab = btn.dataset.tab;
      loadTab(tab);
    });
  });

  // default Q1
  loadTab('Q1');

  function loadTab(tab){
    const apiTabs = ['Q1','Q2','Q3','Q4','Q5','Q6','Q7','Q8','Q9','Q10','Q11','Q12'];
    if(apiTabs.includes(tab)){
      fetch(`/api/data/?q=${tab}`)
        .then(r => r.json())
        .then(res => {
          if(Array.isArray(res)){
            if(tab === 'Q1') renderQ1(chartDiv, res);
            else if(tab === 'Q2') renderQ2(chartDiv, res);
            else if(tab === 'Q3') renderQ3(chartDiv, res);
            else if(tab === 'Q4') renderQ4(chartDiv, res);
            else if(tab === 'Q5') renderQ5(chartDiv, res);
            else if(tab === 'Q6') renderQ6(chartDiv, res);
            else if(tab === 'Q7') renderQ7(chartDiv, res);
            else if(tab === 'Q8') renderQ8(chartDiv, res);
            else if(tab === 'Q9') renderQ9(chartDiv, res);
            else if(tab === 'Q10') renderQ10(chartDiv, res);
            else if(tab === 'Q11') renderQ11(chartDiv, res);
            else renderQ12(chartDiv, res);
          } else {
            d3.select(chartDiv).html('<div class="empty-message">KhÃ´ng láº¥y Ä‘Æ°á»£c dá»¯ liá»‡u</div>');
          }
        })
        .catch(err => {
          console.error(err);
          d3.select(chartDiv).html('<div class="empty-message">Lá»—i táº£i dá»¯ liá»‡u</div>');
        });
    } else {
      // Placeholder
      const fn = window['render' + tab];
      if(typeof fn === 'function') fn(chartDiv); else d3.select(chartDiv).html('<div class="empty-message">ChÆ°a há»— trá»£</div>');
    }
  }
}







