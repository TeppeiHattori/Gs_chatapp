// Firebase設定をJSONファイルから読み込む
fetch('config/firebaseConfig.json')
  .then(response => response.json())
  .then(firebaseConfig => {
    // Firebase初期化
    firebase.initializeApp(firebaseConfig);
    var database = firebase.database();

    // フォーム送信イベントリスナー
    document.getElementById('survey-form').addEventListener('submit', function(event) {
      event.preventDefault();
      var question = document.getElementById('question').value;
      database.ref('responses').push({
        question: question,
        timestamp: firebase.database.ServerValue.TIMESTAMP
      });
      document.getElementById('survey-form').reset();
    });

    // シンプルなテキストトークナイザー関数
    function tokenize(text) {
      return text.split(/\s+/).map(word => word.toLowerCase()).filter(word => word);
    }

    // テキストマイニング関数
    function textMining(data) {
      let allText = '';

      for (let key in data) {
        allText += ' ' + data[key].question;
      }

      console.log("All Text: ", allText);  // デバッグ用ログ

      const words = tokenize(allText);
      const wordFreq = {};

      words.forEach(word => {
        if (wordFreq[word]) {
          wordFreq[word]++;
        } else {
          wordFreq[word] = 1;
        }
      });

      console.log("Word Frequencies: ", wordFreq);  // デバッグ用ログ

      return Object.entries(wordFreq).map(([word, freq]) => ({ text: word, size: freq * 10 }));
    }

    // ワードクラウドの更新
    function updateWordCloud(words) {
      const width = 1000;
      const height = 600;

      const colorScale = d3.scaleOrdinal(d3.schemeCategory10);

      d3.select("#wordcloud").selectAll("*").remove();

      const svg = d3.select("#wordcloud").append("svg")
        .attr("width", width)
        .attr("height", height);

      const layout = d3.layout.cloud()
        .size([width, height])
        .words(words)
        .padding(5)
        .rotate(() => ~~(Math.random() * 2) * 90)
        .font("Impact")
        .fontSize(d => d.size)
        .on("end", draw);

      layout.start();

      function draw(words) {
        svg.append("g")
          .attr("transform", `translate(${width / 2},${height / 2})`)
          .selectAll("text")
          .data(words)
          .enter().append("text")
          .style("font-size", d => `${d.size}px`)
          .style("font-family", "Impact")
          .style("fill", (d, i) => colorScale(i))
          .attr("text-anchor", "middle")
          .attr("transform", d => `translate(${d.x},${d.y})rotate(${d.rotate})`)
          .text(d => d.text)
          .on("mouseover", function(event, d) {
            d3.select(this).transition()
              .style("fill", "red");
          })
          .on("mouseout", function(event, d) {
            d3.select(this).transition()
              .style("fill", (d, i) => colorScale(i));
          });
      }
    }

    // データベース変更イベントリスナー
    database.ref('responses').on('value', function(snapshot) {
      const data = snapshot.val();
      console.log("Realtime data: ", data);  // リアルタイムデータの確認
      const responseList = document.getElementById('response-list');
      responseList.innerHTML = '';

      for (let key in data) {
        var listItem = document.createElement('li');
        listItem.textContent = data[key].question;
        responseList.appendChild(listItem);
      }

      // テキストマイニングとワードクラウドの更新
      const wordFreq = textMining(data);
      console.log("Updating word cloud with data: ", wordFreq);  // デバッグ用ログ
      updateWordCloud(wordFreq);
    });
  })
  .catch(error => console.error('Error loading Firebase config:', error));
