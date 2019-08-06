// Initially all ICs are in uninitialized state.
// They are not hitting the cache and always missing into runtime system.
var STORE$0 = NAMED_STORE_MISS;
var STORE$1 = NAMED_STORE_MISS;
var KEYED_STORE$2 = KEYED_STORE_MISS;
var STORE$3 = NAMED_STORE_MISS;
var LOAD$4 = NAMED_LOAD_MISS;
var STORE$5 = NAMED_STORE_MISS;
var LOAD$6 = NAMED_LOAD_MISS;
var LOAD$7 = NAMED_LOAD_MISS;
var KEYED_LOAD$8 = KEYED_LOAD_MISS;
var STORE$9 = NAMED_STORE_MISS;
var LOAD$10 = NAMED_LOAD_MISS;
var LOAD$11 = NAMED_LOAD_MISS;
var KEYED_LOAD$12 = KEYED_LOAD_MISS;
var LOAD$13 = NAMED_LOAD_MISS;
var LOAD$14 = NAMED_LOAD_MISS;

function MakePoint(x, y) {
  var point = new Table();
  STORE$0(point, 'x', x, 0);
  STORE$1(point, 'y', y, 1);
  return point;
}

function MakeArrayOfPoints(N) {
  var array = new Table();
  var m = -1;
  for (var i = 0; i <= N; i++) {
    m = m * -1;
    // Now we are also distinguishing between expressions x[p] and x.p.
    // The fist one is called keyed load/store and the second one is called
    // named load/store.
    // The main difference is that named load/stores use a fixed known
    // constant string key and thus can be specialized for a fixed property
    // offset.
    KEYED_STORE$2(array, i, MakePoint(m * i, m * -i), 2); // load into x[p]
  }
  STORE$3(array, 'n', N, 3);
  return array;
}

function SumArrayOfPoints(array) {
  var sum = MakePoint(0, 0);
  for (var i = 0; i <= LOAD$4(array, 'n', 4); i++) {
    STORE$5(sum, 'x', LOAD$6(sum, 'x', 6) + LOAD$7(KEYED_LOAD$8(array, i, 8), 'x', 7), 5);
    STORE$9(sum, 'y', LOAD$10(sum, 'y', 10) + LOAD$11(KEYED_LOAD$12(array, i, 12), 'y', 11), 9);
  }
  return sum;
}

function CheckResult(sum) {
  var x = LOAD$13(sum, 'x', 13);
  var y = LOAD$14(sum, 'y', 14);
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

// MISS stubs and compiler

function PatchIC(optype, ic, stub) {
  this[optype + "$" + ic] = stub; // this is a global object -> refers to g.variables defined at the top
}

function NAMED_LOAD_MISS(table, key, ic) {
  var v = LOAD(table, key);
  if(table.klass.kind === "fast") {
    var stub = CompileNamedLoadFastProperty(table.klass, key);
    PatchIC("LOAD", ic, stub);
  }
  return v;
}

function CompileNamedLoadFastProperty(klass, key) {
  // key is constant in named load. specialize index
  var index = klass.getIndex(key);

  function KeyedLoadFastProperty(table, key, ic) {
    if(table.klass !== klass) {
      return NAMED_LOAD_MISS(table, key, ic);
    }
    return table.properties[index];
  }

  return KeyedLoadFastProperty;
}

function NAMED_STORE_MISS(table, key, value, ic) {
  var klass_before = table.klass;
  STORE(table, key, value);
  var klass_after = table.klass;
  if(klass_before.kind === "fast" && klass_after.kind == "fast") {
    var stub = CompileNamedStoreFastProperty(klass_before, klass_after, key);
    PatchIC("STORE", ic, stub);
  }
}

function CompileNamedStoreFastProperty(klass_before, klass_after, key) {
  var index = klass_after.getIndex(key);

  function KeyedStoreFastProperty(table, key, value, ic) {
    // transition happens
    if(klass_before !== klass_after) {
      return function (table, key, value, ic) {
        if(table.klass !== klass_before) {
          return NAMED_STORE_MISS(table, key, value, ic);
        }
        table.properties[index] = value;
        table.klass = klass_after;
      }
    }

    // else no transition happens (updating an existing property)
    else {
      return function (table, key, value, ic) {
        if(table.klass !== klass_before) {
          return NAMED_STORE_MISS(table, key, value, ic);
        }
        table.properties[index] = value;
      }
    }
  }

  return KeyedStoreFastProperty;
}
