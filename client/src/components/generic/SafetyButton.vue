<script setup lang="ts">
// Component that you have to slide to unlock a button.
//
// Heavily influenced by https://github.com/j2only/slide-unlock

import { computed, reactive, watch } from 'vue';

const props = defineProps({
    label:  { type: String,  required: true },

    autoWidth: { type: Boolean, default: true           },
    width:     { type: Number,  default: 400            },
    height:    { type: Number,  default: 60             },
    circle:    { type: Boolean, required: false         },
    disabled:  { type: Boolean, default: false          },
    noanimate: { type: Boolean, default: false          },
    name:      { type: String,  default: "safetybutton" }, // The id of the main element, required to be unique if you have more than one SafetyButton in the DOM at a time
    position:  { type: Number,  default: 0              }  // Control the slider from outside

});

const emit = defineEmits<
{
  (e: 'click'): void
}>()

const Slider = reactive(
{
    CanMove: false,
    IsComplete: false,
    StartPositionWindow: 0,
    HandlerPosition: 0,
    ProgressWidth: 0,
    TextOpacity: 1
});

const isLocked = computed(() => Slider.IsComplete === false);

const baseStyle = computed(() => 
{
    return {
        width: props.autoWidth ? "auto" : props.width + "px",
        height: props.height + "px"
    }
})

const buttonStyle = computed(() => 
{
    return {
        height: props.height + "px"
    }
})

const progressBarStyle = computed(() =>
{
    return {
        width: Slider.ProgressWidth + "px",
        height: props.height + "px",
        borderRadius: props.circle
            ? !Slider.IsComplete
                ? (props.height / 2 + "px 0 0 " + props.height / 2 + "px")
                : (props.height / 2 + "px ")
            : 0
    }
})

const handlerStyle = computed(() => {
    return {
        left: Slider.HandlerPosition + "px",
        width: props.height + "px",
        height: props.height + "px"
    }
})

const lockStyle = computed(() => {
    return {
        width: props.height + "px",
        height: props.height + "px"
    }
})

const sliderWidth = computed(() => 
{
    const h = document.getElementById(props.name) as HTMLElement
    return props.autoWidth
        ? h.clientWidth - (parseInt(getComputedStyle(h).getPropertyValue("--padding").replace("px", ""), 10) * 2)
        : props.width
});

watch(() => props.autoWidth, () =>
{
    if (Slider.IsComplete)
    {
        setTimeout(() =>
        {
            Slider.ProgressWidth = sliderWidth.value
        }, 1)
    }
})

watch(() => props.width, () =>
{
    if (Slider.IsComplete)
        Slider.ProgressWidth = sliderWidth.value
})

// const fadeText = debounce(function(force: boolean = false)
// {
//     const ReversePercent = ((sliderWidth.value - props.height) * (100 / Slider.HandlerPosition)) / 1000 - 0.1
//     if (Slider.CanMove || force)
//         Slider.TextOpacity = ReversePercent
// }, 5)

const fadeText = (force: boolean = false) =>
{
    const ReversePercent = ((sliderWidth.value - props.height) * (100 / Slider.HandlerPosition)) / 1000 - 0.1
    if (Slider.CanMove || force)
        Slider.TextOpacity = ReversePercent
}


const slideStart = (e: MouseEvent | TouchEvent) => 
{
    if (!Slider.IsComplete)
    {
    console.log("start");
        Slider.CanMove = true
        if (window.TouchEvent && e instanceof TouchEvent && e.touches)
            Slider.StartPositionWindow = (e.touches[0].pageX) - Slider.HandlerPosition

        else if (e instanceof MouseEvent)
            Slider.StartPositionWindow = (e.pageX) - Slider.HandlerPosition
    }
    document.onmousemove = (ev) =>
    {
        const el = ev
        slideMoving(el)
        return false
    }
    document.onmouseup = (ev) =>
    {
        const el = ev
        slideFinish(el)
        document.onmousemove = null
        return false
    }
}

const slideMoving = (e: unknown) =>
{
    if (Slider.CanMove && !Slider.IsComplete)
    {
    console.log("moving");
        let pageX = Slider.StartPositionWindow
        if (window.TouchEvent && e instanceof TouchEvent && e.touches)
            pageX = e.touches[0].pageX
        else if (e instanceof MouseEvent)
            pageX = e.pageX

        if (pageX < Slider.StartPositionWindow)
            return
        else
            Slider.HandlerPosition = pageX - Slider.StartPositionWindow

        if (Slider.HandlerPosition > 0 && Slider.HandlerPosition <= (sliderWidth.value - props.height))
        {
            Slider.ProgressWidth = (Slider.HandlerPosition + props.height / 2)
            fadeText()
        }
        else if (Slider.HandlerPosition > (sliderWidth.value - props.height))
        {
            Slider.HandlerPosition = (sliderWidth.value - props.height)
            Slider.ProgressWidth = (sliderWidth.value)
            passVerify()
        }
    }
}

const slideFinish = (e: unknown) =>
{
    if (Slider.CanMove && !Slider.IsComplete)
    {
        console.log("reset");
        reset(); // NOTE: Original code kept the position but I want it to snap back when released

        // let pageX = Slider.StartPositionWindow
        // if (window.TouchEvent && e instanceof TouchEvent && e.touches)
        //     pageX = e.changedTouches[0].pageX
        // else if (e instanceof MouseEvent)
        //     pageX = e.pageX

        // if (pageX < Slider.StartPositionWindow)
        //     return
        // else if (Slider.HandlerPosition < (sliderWidth.value - props.height))
        // {
        //     // ease(
        //     // {
        //     //     startValue: Slider.HandlerPosition,
        //     //     endValue: 0,
        //     //     durationMs: 200,
        //     //     onStep: (value: number) => {
        //     //         Slider.HandlerPosition = value
        //     //         Slider.ProgressWidth = value + (props.height / 2)
        //     //     }
        //     // })
        //     Slider.ProgressWidth = Slider.HandlerPosition + (props.height / 2) // NOTE: I only set this because I don't want the easy-ease library dependency
        //
        //     Slider.TextOpacity = 1
        // }
        // Slider.CanMove = false
    }
}

const emulateSlideFromProps = (pos: number) =>
{
    if (typeof (pos) !== "number" || pos < 0 || Slider.IsComplete || props.disabled)
        return

    const computedPosition = Math.round(((sliderWidth.value - props.height) / 100) * pos)
    Slider.ProgressWidth = computedPosition + (props.height / 2)
    Slider.HandlerPosition = computedPosition
    fadeText(true)
    if (computedPosition >= sliderWidth.value - props.height)
    {
        complete()
        passVerify()
    }
}

watch(() => props.position, () =>
{
    emulateSlideFromProps(props.position)
})

const passVerify = () =>
{
    Slider.IsComplete = true
    Slider.CanMove = false
    console.log(`${props.label} unlocked`);
}

const reset = () =>
{
    Slider.CanMove = false
    Slider.IsComplete = false
    Slider.StartPositionWindow = 0
    Slider.HandlerPosition = 0
    Slider.ProgressWidth = 0
    Slider.TextOpacity = 1
}

const complete = () =>
{
    Slider.CanMove = false
    Slider.IsComplete = true
    Slider.StartPositionWindow = 0
    Slider.HandlerPosition = 0
    Slider.ProgressWidth = sliderWidth.value
    Slider.TextOpacity = 1
}


const click = () =>
{
    emit ("click");
    reset();
}
</script>

<template>
    <local-safety-button class="noselect">
        <local-locked v-if="isLocked"
                :id="props.name"
                :class="{
                    'is-disabled':  disabled,
                    'is-noanimate': noanimate,
                    'is-circle':    circle,
                    'is-complete':  Slider.IsComplete
                }"
                :style="baseStyle"
                @mousemove="slideMoving"
                @touchmove="slideMoving"
                @mouseup="slideFinish"
                @touchend="slideFinish"
            >
            <local-progressbar :style="progressBarStyle"></local-progressbar>
            <local-slide-text  :style="{ opacity: Slider.TextOpacity }">Slide to unlock {{ props.label.toLowerCase() }}</local-slide-text>
            <local-handle      :style="handlerStyle" @mousedown="slideStart" @touchstart="slideStart"></local-handle>
        </local-locked>
        <local-unlocked v-if="isLocked === false">
            <button @click="click"
                class="real-button"
                :class="{ 'is-circle':    circle }"
                :style="buttonStyle"
            >
                {{ label }}
            </button>
            <button @click="reset()"
                class="lock"
                :class="{ 'is-circle':    circle }"
                :style="lockStyle"></button>
        </local-unlocked>
        </local-safety-button>
</template>

<style scoped>
local-safety-button
{
    --text-size: 18px;
    --padding: 6px;
    --su-color-bg: var(--color-off);
    --su-color-progress-normal-bg: var(--color-on);
    --slide-text-color: var(--color-text);

    --handle-bg-color: var(--color-off);
    --handle-icon: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' stroke='%23BABABA' viewBox='0 0 24 24'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='m6 17 5-5-5-5m7 10 5-5-5-5'/%3E%3C/svg%3E");

    display: inline-block;
    width: 100%;

    .is-circle
    {
        border-radius: 50rem;
        &::after
        {
            border-radius: 50rem 0 0 50rem;
        }
        local-handle
        {
            border-radius: 50%;
        }
    }

    .is-noanimate
    {
        &::after
        {
            animation: none;
        }
        local-slide-text
        {
            animation: none;
            color: var(--slide-text-color);
        }
    }

}

local-unlocked
{
    display: flex;
    padding: var(--padding);

    .real-button
    {
        font-size: var(--text-size);
        width: 100%;
        background-color: var(--color-text-highlight);
        color:var(--color-background-soft);
    }

    .lock
    {
        background: var(--handle-bg-color) var(--handle-icon) no-repeat center;
        background-size: 2rem;
        transform: scaleX(-1);
        border: none;
    }
}

local-locked
{

    display: flex;
    position: relative;
    box-sizing: content-box;
    padding: var(--padding);
    background-color: var(--su-color-bg);
    text-align: center;
    overflow: hidden;
    
    &::after
    {
        content: "";
        position: absolute;
        top: 0;
        left: 0;
        width: 0%;
        height: 100%;
        transition: none;
        animation: shine 4s infinite;
        background-color: rgb(255 255 255 / 40%);
        overflow: hidden;
    }

    local-progressbar
    {
        position: absolute;
        z-index: 1;
        width: 0;
        transition: background 1s ease-out;
        background-color: var(--su-color-progress-normal-bg);
    }

    local-slide-text
    {
        display: inline;
        z-index: 2;
        align-items: center;
        justify-content: center;
        width: 100%;
        color: var(--slide-text-color);
        font-size: var(--text-size);
        user-select: none;

        &::before
        {
            content: "";
            display: inline-block;
            height: 100%;
            vertical-align: middle;
        }
    }

    local-handle
    {
        position: absolute;
        z-index: 3;
        top: 0;
        left: 0;
        margin: var(--padding);
        transition: background 0.75s ease, transform 0.1s ease-in;
        background: var(--handle-bg-color) var(--handle-icon) no-repeat center;
        background-size: 2rem;
        cursor: grab;
        overflow: hidden;

        &:active
        {
            transform: scale(1.05);
            cursor: grabbing;
        }
    }

    
    &.is-disabled
    {
        opacity: 0.5;
        &::after
        {
            content: "";
            position: absolute;
            z-index: 10;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            animation: none;
            opacity: 0.5;
            background-color: var(--su-color-bg);
        }

        local-slide-text
        {
            animation: none;
            opacity: 0.25;
            color: var(--slide-text-color);
        }
        
        local-handle
        {
            pointer-events: none;
        }
    }

    &.is-disabled.is-circle
    {
        &::after
        {
            border-radius: 50rem;
        }
    }
    &.is-complete
    {
        &::after
        {
            animation: none;
        }
        
        local-progressbar
        {
            background-color: var(--su-color-progress-complete-bg);
        }
        
        local-slide-text
        {
            animation: none;
            opacity: 1 !important;
            color: var(--su-color-text-complete);
        }
        
        local-handle
        {
            opacity: 0;
            background: var(--su-color-progress-complete-bg);
        }
    }
}

@keyframes animated
{
    from { background-position: -300px 0; }
    to   { background-position: 300px 0;  }
}
@keyframes shine
{
    100%
    {
        width: 100%;
        transition: all 5s ease-out;
        background-color: rgb(255 255 255 / 0%);
    }
}

.noselect
{
  -webkit-touch-callout: none; /* iOS Safari */
    -webkit-user-select: none; /* Safari */
     -khtml-user-select: none; /* Konqueror HTML */
       -moz-user-select: none; /* Old versions of Firefox */
        -ms-user-select: none; /* Internet Explorer/Edge */
            user-select: none; /* Non-prefixed version, currently
                                  supported by Chrome, Edge, Opera and Firefox */
}
</style>
