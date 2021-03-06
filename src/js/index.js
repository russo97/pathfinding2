(function () {

  var wallSet = [];

  const $ = document.querySelector.bind(document);

  const canvas = $('#pathfindindRendered'), ctx = canvas.getContext('2d');

  const algorithm = $('#algorithm');
  
  var tileSize;

  var r = random(0, 255),
    g = random(0, 255),
    b = random(0, 255);

  var heuristicMode = 'Manhattan';

  var wallColor = 'purple', lineColor = {
    lookingFor: 'skyblue',
    founded:    '#1782c5'
  };

  var openSet, closedSet, start, end, _matrix;

  var rows = 70, cols = 70, wallQnt = Math.floor((rows * cols) * .4);

  var freeTiles = Math.floor(rows * cols) - wallQnt;


  function random (min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
  }


  function map (value, min1, max1, min2, max2) {
    return min2 + (max2 - min2) * ((value - min2) / (max1 - min1));
  }


  function clearCanvas (newColor = '#fff') {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawRect(0, 0, canvas.width, canvas.height, newColor);
  }


  function drawRect (x, y, w, h, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w, h);
  }


  function percent (value, total) {
    return (value * 100) / total;
  }


  function randomizeColor () {
    r = random(0, 255);
    g = random(0, 255);
    b = random(0, 255);
  }


  function setCanvas (w) {
    tileSize = w / rows;

    ctx.lineCap   = 'round';
    ctx.lineWidth = tileSize * .35;

    algorithm.addEventListener('change', e => {
      heuristicMode = e.target.value;
    });

    init();
  }


  function init () {
    _matrix = setMatrix(rows, cols);

    start = _matrix[0][0];
    end   = _matrix[cols - 1][rows - 1];

    openSet   = [start];
    closedSet = [];

    randomizeColor();

    wallSet = [];

    _matrix.forEach(row => wallSet.push(...row.filter(cell => cell.wall)));

    update();
  }


  function setMatrix (w, h) {
    let matrix = [];

    while (h--) {
      let preserveW = 0, row = [];

      while (preserveW < w) {
        row.push(new Spot(preserveW++, h, tileSize));
      }

      matrix.unshift(row);
    }

    return setWalls(matrix);
  }


  function setWalls (matrix) {
    let x, y, randomCell;

    while (wallQnt > countingWalls(matrix)) {
      x = random(0, rows - 1);
      y = random(0, cols - 1);

      randomCell = matrix[y][x];

      if (randomCell && !randomCell.wall && (x || y) && (x != rows - 1 || y != cols - 1)) {
        randomCell.wall = 1;
      }
    }

    return setNeighbors(matrix);
  }


  function countingWalls (matrix) {
    return matrix.reduce((acc, row) => acc + row.filter(cell => cell.wall).length, 0);
  }


  function setNeighbors (matrix) {
    matrix.forEach(row => {
      row.forEach(cell => !cell.wall && cell.setNeighbors(matrix));
    });

    return matrix;
  }


  function draw () {
    clearCanvas();

    let closedSetLength = closedSet.length;

    wallSet.forEach(cell => cell.draw(drawRect, wallColor));

    closedSet.forEach((cell, i) => {
      let backgroundOpacity = map(i, 0, closedSetLength, 0, 1);

      cell.draw(drawRect, `rgba(${r}, ${g}, ${b}, ${backgroundOpacity}`);
    });
  }


  function lowestF (matrix) {
    return matrix.slice().sort((a, b) => a.f - b.f).splice(0, 1)[0];
  }


  function heuristic (a, b, mode) {
    let d1, d2;

    switch (mode) {
      case 'Manhattan':
        d1 = Math.abs(a.x - b.x);
        d2 = Math.abs(a.y - b.y);
        break;
      case 'Euclidian':
        d1 = Math.pow(Math.abs(a.x - b.x), 2);
        d2 = Math.pow(Math.abs(a.y - b.y), 2);
        break;
    }

    return Math.sqrt(d1 + d2);
  }


  function drawParent (_node, color) {
    ctx.beginPath();
    ctx.strokeStyle = color;
    [_node, start, end].forEach(cell => cell.draw(drawRect, color));

    while (_node.parent) {
      _node = route(_node, _node.parent);
    }

    ctx.closePath();
    ctx.stroke()
  }


  function route (from, to) {
    let half = from.w * .5, F = from, T = to, TP = T.parent;

    if (TP) {
      if (F.y == TP.y && (F.x < TP.x || F.x > TP.x) ||
        F.x == TP.x && (F.y < TP.y || F.y > TP.y)) {
        return route(F, TP);
      }
    }

    ctx.moveTo(F.x * F.w + half, F.y * F.w + half);
    ctx.lineTo(T.x * T.w + half, T.y * T.w + half);

    return T;
  }


  function update (time) {
    draw();

    if (openSet.length) {
      let currentNode = lowestF(openSet);

      if (currentNode === end) {
        openSet = [];

        setTimeout(_ => init(), 4000);

        return drawParent(currentNode, lineColor.founded);
      }

      drawParent(currentNode, lineColor.lookingFor);

      closedSet.push(openSet.splice(openSet.indexOf(currentNode), 1)[0]);

      let neighbors = currentNode.neighbors;

      for (let i = 0, len = neighbors.length; i < len; i++) {
        let neighbor = neighbors[i];

        if (closedSet.indexOf(neighbor) >= 0) {
          continue;
        }

        let gScore       = currentNode.g + 1,
          betterGScore = 0;

        if (openSet.indexOf(neighbor) === -1) {
          betterGScore = 1;
          neighbor.h = heuristic(neighbor, end, heuristicMode);
          openSet.push(neighbor);
        } else if (gScore < neighbor.g) {
          betterGScore = 1;
        }

        if (betterGScore) {
          neighbor.g      = gScore;
          neighbor.parent = currentNode;
          neighbor.f      = neighbor.g + neighbor.h;
        }
      }

      requestAnimationFrame(update, canvas);
    } else init();
  }

  window.onload = setCanvas(500);
} ());