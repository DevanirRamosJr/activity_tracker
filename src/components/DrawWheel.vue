<template>
  <div class="relative mx-auto" style="width: 100%; max-width: 320px; aspect-ratio: 1;">
    <!-- Pointer -->
    <div
      class="absolute left-1/2 -translate-x-1/2 z-10 text-gray-900 dark:text-gray-100"
      style="top: -2px; width: 0; height: 0; border-left: 11px solid transparent; border-right: 11px solid transparent; border-top: 18px solid;"
    ></div>

    <!-- Circular clip so the rotating square's corners never overflow the page -->
    <div style="width: 100%; height: 100%; overflow: hidden; border-radius: 50%;">
      <!-- Rotating wheel -->
      <div ref="wheelEl" :style="wheelStyle" @transitionend="onEnd">
        <svg viewBox="0 0 300 300" width="100%" height="100%">
          <defs>
            <clipPath v-for="s in slices" :id="'wheel-clip-' + s.i" :key="'c' + s.i">
              <circle v-if="s.full" cx="150" cy="150" r="140" />
              <path v-else :d="s.path" />
            </clipPath>
          </defs>

          <g v-for="s in slices" :key="s.i">
            <circle v-if="s.full" cx="150" cy="150" r="140" :fill="s.color" stroke="#fff" stroke-width="2" />
            <path v-else :d="s.path" :fill="s.color" stroke="#fff" stroke-width="2" />

            <image
              v-if="s.useImage"
              :href="s.img"
              :x="s.imgBox.x"
              :y="s.imgBox.y"
              :width="s.imgBox.size"
              :height="s.imgBox.size"
              preserveAspectRatio="xMidYMid slice"
              :clip-path="'url(#wheel-clip-' + s.i + ')'"
            />
            <circle
              v-if="s.useImage && s.full"
              cx="150"
              cy="150"
              r="140"
              fill="none"
              stroke="#fff"
              stroke-width="2"
            />
            <path v-if="s.useImage && !s.full" :d="s.path" fill="none" stroke="#fff" stroke-width="2" />

            <text
              v-if="s.showLabel"
              :transform="labelTransform(s.seg)"
              text-anchor="start"
              dominant-baseline="middle"
              font-size="11"
              fill="#1f2937"
            >
              {{ label(s.seg.entry) }}
            </text>
          </g>

          <circle cx="150" cy="150" r="20" fill="#111827" />
        </svg>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { targetRotation } from '../lib/draw'

const props = defineProps({
  segments: { type: Array, required: true },
  showImages: { type: Boolean, default: false },
})
const emit = defineEmits(['done'])

// Below this slice size, the odds are too small to bother loading an image.
const IMG_MIN_SPAN = 15

const BG_HEX = {
  'bg-blue-100': '#dbeafe',
  'bg-yellow-100': '#fef9c3',
  'bg-purple-100': '#f3e8ff',
  'bg-pink-100': '#fce7f3',
  'bg-green-100': '#dcfce7',
  'bg-red-100': '#fee2e2',
  'bg-orange-100': '#ffedd5',
  'bg-teal-100': '#ccfbf1',
  'bg-indigo-100': '#e0e7ff',
}

const rotation = ref(0)
const spinning = ref(false)
const wheelEl = ref(null)

const wheelStyle = computed(() => ({
  transformOrigin: 'center center',
  transform: `rotate(${rotation.value}deg)`,
  transition: spinning.value ? 'transform 4.5s cubic-bezier(0.16, 1, 0.3, 1)' : 'none',
}))

// The image is centred on the wedge and sized just large enough to cover it,
// so bigger (higher-odds) slices get a bigger image and never leave gaps.
const IMG_CENTROID_R = 82

function imageBox(seg) {
  const c = point(IMG_CENTROID_R, seg.mid)
  const corners = [
    { x: 150, y: 150 },
    point(140, seg.start),
    point(140, seg.end),
    point(140, seg.mid),
  ]
  const maxDist = Math.max(...corners.map(p => Math.hypot(p.x - c.x, p.y - c.y)))
  const size = maxDist * 2
  return { x: c.x - size / 2, y: c.y - size / 2, size }
}

const slices = computed(() => {
  const full = props.segments.length === 1
  return props.segments.map((seg, i) => {
    const useImage = props.showImages && !!seg.entry.image_url && seg.span >= IMG_MIN_SPAN
    return {
      i,
      seg,
      full,
      path: full ? null : arcPath(seg),
      useImage,
      img: seg.entry.image_url,
      imgBox: full ? { x: 10, y: 10, size: 280 } : imageBox(seg),
      color: fillFor(seg.entry),
      showLabel: !useImage && (full || seg.span >= 12),
    }
  })
})

function fillFor(entry) {
  return BG_HEX[entry.category?.color_bg] || '#e5e7eb'
}

function label(entry) {
  const t = entry.title || ''
  return t.length > 12 ? t.slice(0, 11) + '…' : t
}

function point(r, angle) {
  const rad = (angle * Math.PI) / 180
  return { x: 150 + r * Math.sin(rad), y: 150 - r * Math.cos(rad) }
}

function arcPath(seg) {
  const r = 140
  const p0 = point(r, seg.start)
  const p1 = point(r, seg.end)
  const large = seg.span > 180 ? 1 : 0
  return `M 150 150 L ${p0.x.toFixed(2)} ${p0.y.toFixed(2)} A ${r} ${r} 0 ${large} 1 ${p1.x.toFixed(2)} ${p1.y.toFixed(2)} Z`
}

// Labels run radially along each spoke, all using the same rule
// (reading from the centre outward) without flipping by side.
function labelTransform(seg) {
  const p = point(34, seg.mid)
  const rot = seg.mid - 90
  return `rotate(${rot} ${p.x.toFixed(2)} ${p.y.toFixed(2)}) translate(${p.x.toFixed(2)} ${p.y.toFixed(2)})`
}

function onEnd() {
  if (!spinning.value) return
  spinning.value = false
  emit('done')
}

async function spin(winnerIndex) {
  const seg = props.segments[winnerIndex]
  if (!seg) return
  spinning.value = true
  await new Promise(r => requestAnimationFrame(r))
  rotation.value = targetRotation(rotation.value, seg.mid)
}

defineExpose({ spin })
</script>
