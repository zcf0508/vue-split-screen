import { h, defineComponent } from "vue";

export const SplitPlaceholder = defineComponent({
    name: 'SplitPlaceholder',
    setup(props, ctx){
        return()=>{
            return h(
                'div',
                '空白页'
            )
        }
    }
})
