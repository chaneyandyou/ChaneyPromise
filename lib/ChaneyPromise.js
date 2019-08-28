const PENDING = 'panding'
const FULFILLED = 'fulfilled'
const REJECTED = 'rejected'

function CPromise (executor) {
  const _this = this
  _this.status = PENDING
  _this.value = null
  _this.reason = null

  _this.onFulfilledCallbacks = []
  _this.onRejectedCallbacks = []

  function resolve (value) {
    if (_this.status === PENDING) {
      _this.status = FULFILLED
      _this.value = value

      _this.onFulfilledCallbacks.forEach(function (fulfilledCallback) {
        fulfilledCallback()
      })
    }
  }
  function reject (reason) {
    if (_this.status === PENDING) {
      _this.status = REJECTED
      _this.reason = reason

      _this.onRejectedCallbacks.forEach(function (rejectedCallback) {
        rejectedCallback()
      })
    }
  }

  try {
    executor(resolve, reject)
  } catch (reason) {
    reject(reason)
  }
}

CPromise.prototype.resolvePromise = function (promise2, x, resolve, reject) {
  let self = this;
  let called = false;   // called 防止多次调用

  if (promise2 === x) {
    return reject(new TypeError('循环引用'));
  }

  if (x !== null && (Object.prototype.toString.call(x) === '[object Object]' ||
    Object.prototype.toString.call(x) === '[object Function]')
  ) {
    // x是对象或者函数
    try {
      let then = x.then;

      if (typeof then === 'function') {
        then.call(x, (y) => {
          // 别人的Promise的then方法可能设置了getter等，使用called防止多次调用then方法
          if (called) return ;
          called = true;
          // 成功值y有可能还是promise或者是具有then方法等，再次resolvePromise，直到成功值为基本类型或者非thenable
          self.resolvePromise(promise2, y, resolve, reject);
        }, (reason) => {
          if (called) return ;
          called = true;
          reject(reason);
        });
      } else {
        if (called) return ;
        called = true;
        resolve(x);
      }
    } catch (reason) {
      if (called) return ;
      called = true;
      reject(reason);
    }
  } else {
    // x是普通值，直接resolve
    resolve(x);
  }
}

CPromise.prototype.then = function (onFulfilled, onRejected) {
  const _this = this

  let promise2 = null

  onFulfilled = typeof onFulfilled === 'function' ? onFulfilled : value => value
  onRejected = typeof onRejected === 'function' ? onRejected : reason => { throw reason }

  promise2 = new CPromise((resolve, reject) => {
    if (_this.status === PENDING) {
      _this.onFulfilledCallbacks.push(() => {
        setTimeout(() => {
          try {
            let x = onFulfilled(_this.value)
            // onFulfilled && onFulfilled(_this.value)
            _this.resolvePromise(promise2, x, resolve, reject)
          } catch (reason) {
            reject(reason)
          }
        });
      })
  
      _this.onRejectedCallbacks.push(() => {
        setTimeout(() => {
          try {
            let x = onRejected(_this.reason)
            _this.resolvePromise(promise2, x, resolve, reject)
            // onRejected && onRejected(_this.reason)
          } catch (reason) {
            reject(reason)
          }
        });
      })
    }
  
    if (_this.status === FULFILLED) {
      setTimeout(() => {
        try {
          let x = onFulfilled(_this.value)
          // onFulfilled && onFulfilled(_this.value)
          _this.resolvePromise(promise2, x, resolve, reject)
        } catch (reason) {
          reject(reason)
        }
      });
    }
  
    if (_this.status === REJECTED) {
      setTimeout(() => {
        try {
          let x = onRejected(_this.reason)
          // onRejected && onRejected(_this.reason)
          _this.resolvePromise(promise2, x, resolve, reject)
        } catch (reason) {
          reject(reason)
        }
      });
    }

  })

  return promise2
}

CPromise.prototype.catch = function (onRejected) {
  return this.then(null, onRejected)
}

export default CPromise

