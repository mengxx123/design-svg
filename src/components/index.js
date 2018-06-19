import page from './page'
import handler from './handler'

export default {
    install: function (Vue) {
        Vue.component('my-page', page)
        Vue.component('handler', handler)
    }
}
