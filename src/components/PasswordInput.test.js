import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import PasswordInput from './PasswordInput.vue'

describe('PasswordInput', () => {
  it('hides the password by default', () => {
    const wrapper = mount(PasswordInput, { props: { modelValue: 'secret' } })
    expect(wrapper.find('input').attributes('type')).toBe('password')
    expect(wrapper.find('button').attributes('aria-label')).toBe('Show password')
  })

  it('reveals and re-hides the password when the toggle is clicked', async () => {
    const wrapper = mount(PasswordInput, { props: { modelValue: 'secret' } })
    const button = wrapper.find('button')

    await button.trigger('click')
    expect(wrapper.find('input').attributes('type')).toBe('text')
    expect(button.attributes('aria-label')).toBe('Hide password')

    await button.trigger('click')
    expect(wrapper.find('input').attributes('type')).toBe('password')
    expect(button.attributes('aria-label')).toBe('Show password')
  })

  it('emits update:modelValue on input', async () => {
    const wrapper = mount(PasswordInput, { props: { modelValue: '' } })
    await wrapper.find('input').setValue('hunter2')
    expect(wrapper.emitted('update:modelValue')[0]).toEqual(['hunter2'])
  })

  it('passes through placeholder and autocomplete', () => {
    const wrapper = mount(PasswordInput, {
      props: { placeholder: 'Password', autocomplete: 'new-password' },
    })
    const input = wrapper.find('input')
    expect(input.attributes('placeholder')).toBe('Password')
    expect(input.attributes('autocomplete')).toBe('new-password')
  })

  it('does not submit a surrounding form when toggled', () => {
    const wrapper = mount(PasswordInput)
    expect(wrapper.find('button').attributes('type')).toBe('button')
  })
})
