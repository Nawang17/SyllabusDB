// Shared form/layout patterns used while retaining the existing submission flows.
import { useId, useState, useRef } from 'react'
import { Button as BaseButton } from './button'
import { Dialog, DialogContent, DialogTitle } from './dialog'
import { Input } from './input'
import { SearchableSelect } from './searchable-select'
import { cn } from '@/lib/utils'

export function useDisclosure(initial = false) {
  const [opened, setOpened] = useState(initial)
  return [opened, { open: () => setOpened(true), close: () => setOpened(false), toggle: () => setOpened(value => !value) }]
}
export function Button({ loading, disabled, children, leftSection, rightSection, fullWidth, color, size, radius, variant, ...props }) {
  void size; void radius
  return <BaseButton {...props} variant={color === 'red' && !variant ? 'destructive' : ({ light: 'secondary', subtle: 'ghost', default: 'outline' })[variant] || variant} disabled={disabled || loading} aria-busy={loading || undefined} style={{ ...props.style, ...(fullWidth ? { width: '100%' } : {}) }}>{loading ? <span role="status" aria-label="Working" className="ui-spinner" /> : leftSection}{children}{rightSection}</BaseButton>
}
export function Modal({ opened, onClose, title, children, closeOnClickOutside = true, closeOnEscape = true, withCloseButton = true, size, classNames = {} }) {
  const previousFocus = useRef(null)
  return <Dialog open={opened} onOpenChange={open => { if (!open) onClose() }}><DialogContent withCloseButton={withCloseButton} className={size === 'lg' || size === 'xl' ? 'max-w-3xl' : ''} aria-describedby={undefined} onOpenAutoFocus={() => { previousFocus.current = document.activeElement }} onCloseAutoFocus={event => { event.preventDefault(); previousFocus.current?.focus() }} onPointerDownOutside={event => { if (!closeOnClickOutside) event.preventDefault() }} onEscapeKeyDown={event => { if (!closeOnEscape) event.preventDefault() }}><DialogTitle className={cn('text-lg font-semibold pr-8', classNames.title)}>{title || 'SyllabusDB'}</DialogTitle><div className={classNames.body}>{children}</div></DialogContent></Dialog>
}
const spaces = { xs: '.5rem', sm: '.75rem', md: '1rem', lg: '1.5rem', xl: '2rem' }
function space(value) { return spaces[value] || value }
export function Box({ component: Comp = 'div', children, className, style, p, px, py, m, mt, mb, my, w, h, ...props }) {
  return <Comp className={className} style={{ padding: space(p), paddingInline: space(px), paddingBlock: space(py), margin: space(m), marginTop: space(mt), marginBottom: space(mb), marginBlock: space(my), width: w, height: h, ...style }} {...props}>{children}</Comp>
}
export function Group({ justify, align = 'center', gap = 'sm', wrap, style, ...props }) { return <Box {...props} style={{ display: 'flex', alignItems: align, justifyContent: justify, gap: space(gap), flexWrap: wrap || 'wrap', ...style }} /> }
export function Stack({ gap = 'md', style, ...props }) { return <Box {...props} style={{ display: 'flex', flexDirection: 'column', gap: space(gap), ...style }} /> }
export function Flex({ direction, ...props }) { return <Group {...props} style={{ flexDirection: direction, ...props.style }} /> }
export function Text({ component: Comp = 'p', fw, size, c, ta, style, ...props }) { return <Box component={Comp} {...props} style={{ fontWeight: fw, fontSize: space(size), color: c === 'dimmed' ? 'var(--muted-foreground)' : undefined, textAlign: ta, ...style }} /> }
export function Title({ order = 1, ...props }) { return <Text component={`h${order}`} {...props} /> }
export function Container({ size, style, ...props }) { return <Box {...props} style={{ maxWidth: typeof size === 'number' ? size : 1200, marginInline: 'auto', padding: '1rem', ...style }} /> }
export function Paper({ withBorder, radius, shadow, className, ...props }) { void radius; void shadow; return <Box className={cn('rounded-lg bg-card', withBorder && 'border', className)} {...props} /> }
export function ThemeIcon({ size, variant, radius, color, ...props }) { void size; void variant; void radius; void color; return <Box {...props} /> }
export function Collapse({ in: shown, children }) { return shown ? <div>{children}</div> : null }
export function Skeleton({ height, width, radius, className, ...props }) { void radius; return <div aria-hidden="true" className={cn('animate-pulse rounded bg-muted', className)} style={{ height, width }} {...props} /> }
export function Avatar({ src, children, size = 36, radius, alt = '', ...props }) { void radius; return src ? <img src={src} alt={alt} className="rounded-full object-cover" width={size} height={size} {...props} /> : <span className="inline-flex items-center justify-center rounded-full bg-secondary p-2" {...props}>{children}</span> }
export function Progress({ value }) { return <progress className="w-full accent-primary" aria-label="Upload progress" max={100} value={value} /> }
export function Alert({ title, children, color }) { void color; return <div role="alert" className="my-3 rounded border p-4"><strong>{title}</strong>{children}</div> }
function Field({ label, description, error, required, children, id }) { return <div className="grid gap-1.5"><label className="text-sm font-medium" htmlFor={id}>{label}{required && ' *'}</label>{children}{description && <p className="text-sm text-muted-foreground">{description}</p>}{error && <p role="alert" className="text-sm text-destructive">{error}</p>}</div> }
export function TextInput({ label, description, error, size, radius, ...props }) { void size; void radius; const id = useId(); return <Field {...{ label, description, error, id, required: props.required }}><Input id={id} {...props} /></Field> }
export function Textarea({ label, description, error, autosize, minRows, maxRows, size, radius, ...props }) { void autosize; void maxRows; void size; void radius; const id = useId(); return <Field {...{ label, description, error, id, required: props.required }}><textarea id={id} rows={minRows || 3} className="w-full rounded-md border border-input bg-background p-3 focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50" {...props} /></Field> }
export function Select({ label, data = [], value, onChange, placeholder = 'Choose…', searchable, nothingFoundMessage = 'No matches', allowDeselect, size, radius, error, description, ...props }) {
  void allowDeselect; void size; void radius
  const id = useId()
  const options = data.map(item => typeof item === 'string' ? { value: item, label: item } : item)
  if (searchable) return <SearchableSelect {...props} {...{ label, data, value, onChange, placeholder, nothingFoundMessage, error, description }} />
  return <Field {...{ label, description, error, id, required: props.required }}><select {...props} id={id} className="h-11 w-full rounded-md border border-input bg-background px-3 text-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50" value={value ?? ''} onChange={event => onChange(event.target.value || null)}><option value="" disabled={props.required}>{placeholder}</option>{options.map(item => <option key={item.value} value={item.value} disabled={item.disabled}>{item.label}</option>)}</select></Field>
}
export function Autocomplete({ label, data = [], onChange, maxDropdownHeight, size, radius, nothingFoundMessage = 'No matching courses. You can enter a new course code.', ...props }) { void maxDropdownHeight; void size; void radius; return <SearchableSelect {...props} {...{ label, data, onChange, nothingFoundMessage }} allowCustomValue /> }
export function Rating({ value = 0, onChange, readOnly, size, ...props }) { void size; const name = useId(); return readOnly ? <span {...props} role="img" aria-label={props['aria-label'] || `${value} out of 5 stars`}>{'★'.repeat(Math.round(value))}{'☆'.repeat(5-Math.round(value))}</span> : <fieldset {...props} className="inline-flex gap-2"><legend className="sr-only">{props['aria-label'] || 'Class rating'}</legend>{[1,2,3,4,5].map(number => <label key={number} className="cursor-pointer text-2xl text-primary"><input type="radio" className="sr-only peer" name={name} value={number} checked={value === number} onChange={() => onChange(number)} /><span className="peer-focus-visible:outline peer-focus-visible:outline-2" aria-hidden="true">{number <= value ? '★' : '☆'}</span><span className="sr-only">{number} stars</span></label>)}</fieldset> }
export function Switch({ label, description, size, checked, onChange, ...props }) { void size; const id = useId(); return <Field label={label} description={description} id={id}><input {...props} id={id} type="checkbox" role="switch" checked={checked} onChange={onChange} className="h-6 w-10 accent-primary" /></Field> }
