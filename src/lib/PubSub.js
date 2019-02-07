import _ from 'lodash';

export default {
  enable(target) {
    let subCount = 0;
    // eslint-disable-next-line no-param-reassign
    target.subscribe = (event, callback) => {
      subCount += 1;
      this.subscribers = this.subscribers || {};
      this.subscribers[event] = this.subscribers[event] || {};
      this.subscribers[event][subCount] = (callback);
      return subCount;
    };

    // eslint-disable-next-line no-param-reassign
    target.publish = (event, ...args) => {
      if (this.subscribers && this.subscribers[event]) {
        const subs = this.subscribers[event];
        _.forOwn(subs, (element) => {
          element.apply(target, args);
        });
      }
    };

    // eslint-disable-next-line no-param-reassign
    target.unsubscribe = (token) => {
      _.forOwn(this.subscribers, (sub) => {
        // eslint-disable-next-line no-param-reassign
        delete sub[token];
      });
    };
  },
};
