import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'

const searchImages = vi.fn()
const uploadImage = vi.fn()
vi.mock('../lib/imageSearch', () => ({ searchImages: (...a) => searchImages(...a) }))
vi.mock('../lib/storage', () => ({ uploadImage: (...a) => uploadImage(...a) }))

import ImagePicker from './ImagePicker.vue'

describe('ImagePicker', () => {
  beforeEach(() => {
    searchImages.mockReset()
    uploadImage.mockReset()
  })

  it('prefills the search box from the title prop', () => {
    const wrapper = mount(ImagePicker, { props: { title: 'Halo' } })
    expect(wrapper.find('input[type="text"], input:not([type])').element.value).toBe('Halo')
  })

  it('mirrors title changes into the search box in real time', async () => {
    const wrapper = mount(ImagePicker, { props: { title: 'Zel' } })
    await wrapper.setProps({ title: 'Zelda' })
    expect(wrapper.find('input:not([type])').element.value).toBe('Zelda')
  })

  it('stops mirroring the title once the user edits the search box', async () => {
    const wrapper = mount(ImagePicker, { props: { title: 'Zel' } })
    const box = wrapper.find('input:not([type])')
    await box.setValue('my own query')
    await wrapper.setProps({ title: 'Zelda' })
    expect(box.element.value).toBe('my own query')
  })

  it('shows the current image and emits empty when removed', async () => {
    const wrapper = mount(ImagePicker, { props: { modelValue: 'https://img/x.jpg' } })
    expect(wrapper.find('img').attributes('src')).toBe('https://img/x.jpg')

    await wrapper.find('button[aria-label="Remove image"]').trigger('click')
    expect(wrapper.emitted('update:modelValue')[0]).toEqual([''])
  })

  it('renders search results and emits the picked url', async () => {
    searchImages.mockResolvedValue([
      { url: 'https://img/1.jpg', thumbnail: 'https://t/1.jpg', title: '1' },
      { url: 'https://img/2.jpg', thumbnail: 'https://t/2.jpg', title: '2' },
    ])
    const wrapper = mount(ImagePicker, { props: { title: 'Halo' } })

    await wrapper.findAll('button').find(b => b.text() === 'Search').trigger('click')
    await flushPromises()

    const thumbs = wrapper.findAll('.grid button')
    expect(thumbs).toHaveLength(2)
    expect(searchImages).toHaveBeenCalledWith('Halo')

    await thumbs[1].trigger('click')
    expect(wrapper.emitted('update:modelValue').pop()).toEqual(['https://img/2.jpg'])
  })

  it('shows a message when the search returns nothing', async () => {
    searchImages.mockResolvedValue([])
    const wrapper = mount(ImagePicker, { props: { title: 'zzz' } })
    await wrapper.findAll('button').find(b => b.text() === 'Search').trigger('click')
    await flushPromises()
    expect(wrapper.text()).toContain('No images found')
  })

  it('surfaces a search error', async () => {
    searchImages.mockRejectedValue(new Error('Quota exceeded'))
    const wrapper = mount(ImagePicker, { props: { title: 'x' } })
    await wrapper.findAll('button').find(b => b.text() === 'Search').trigger('click')
    await flushPromises()
    expect(wrapper.text()).toContain('Quota exceeded')
  })

  it('uploads a file and emits its url', async () => {
    uploadImage.mockResolvedValue('https://storage/uploaded.png')
    const wrapper = mount(ImagePicker)

    const file = new File(['data'], 'pic.png', { type: 'image/png' })
    const input = wrapper.find('input[type="file"]')
    Object.defineProperty(input.element, 'files', { value: [file] })
    await input.trigger('change')
    await flushPromises()

    expect(uploadImage).toHaveBeenCalledWith(file)
    expect(wrapper.emitted('update:modelValue').pop()).toEqual(['https://storage/uploaded.png'])
  })
})
