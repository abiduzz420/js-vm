var STORE$0 = NAMED_STORE_MISS;
var STORE$1 = NAMED_STORE_MISS;
var KEYED_STORE$2 = KEYED_STORE_MISS;
var STORE$3 = NAMED_STORE_MISS;
var LOAD$4 = NAMED_LOAD_MISS;
var STORE$5 = NAMED_STORE_MISS;
var LOAD$6 = NAMED_LOAD_MISS;
var LOAD$7 = NAMED_LOAD_MISS;
var KEYED_LOAD$8 = NAMED_LOAD_MISS;
var STORE$9 = NAMED_STORE_MISS;
var LOAD$10 = NAMED_LOAD_MISS;
var LOAD$11 = NAMED_LOAD_MISS;
var KEYED_LOAD$12 = KEYED_LOAD_MISS;
var LOAD$13 = NAMED_LOAD_MISS;
var LOAD$14 = NAMED_LOAD_MISS;

function MakePoint(x, y) {
  var point = new Table();
  STORE(point, 'x', x);
  STORE(point, 'y', y);
  return point;
}

function MakeArrayOfPoints(N) {
  var array = new Table();
  var m = -1;
  for (var i = 0; i <= N; i++) {
    m = m * -1;
    STORE(array, i, MakePoint(m * i, m * -i));
  }
  STORE(array, 'n', N);
  return array;
}

function SumArrayOfPoints(array) {
  var sum = MakePoint(0, 0);
  for (var i = 0; i <= LOAD(array, 'n'); i++) {
    STORE(sum, 'x', LOAD(sum, 'x') + LOAD(LOAD(array, i), 'x'));
    STORE(sum, 'y', LOAD(sum, 'y') + LOAD(LOAD(array, i), 'y'));
  }
  return sum;
}

function CheckResult(sum) {
  var x = LOAD(sum, 'x');
  var y = LOAD(sum, 'y');
  if (x !== 50000 || y !== -50000) {
    throw new Error("failed: x = " + x + ", y = " + y);
  }
}

var N = 100000;
var array = MakeArrayOfPoints(N);
var start = LOAD(os, 'clock')() * 1000;
for (var i = 0; i <= 5; i++) {
  var sum = SumArrayOfPoints(array);
  CheckResult(sum);
}
var end = LOAD(os, 'clock')() * 1000;
print(end - start);
