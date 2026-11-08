import { useEffect, useId, useRef, useState } from 'react'
import { IconCheck, IconChevronDown } from '@tabler/icons-react'
import { Input } from './input'

export function SearchableSelect({ label, data, value, onChange, placeholder, nothingFoundMessage, description, error, required, disabled, name, allowCustomValue = false, onBlur, filterOption }) {
  const id = useId()
  const input = useRef(null)
  const container = useRef(null)
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState(null)
  const [active, setActive] = useState(-1)
  const options = data.map(item => typeof item === 'string' ? { value:item, label:item } : item)
  const selected = options.find(option => option.value === value)
  const search = (query ?? (allowCustomValue ? value : '') ?? '').trim()
  const matches = options.filter(option => !option.disabled && (filterOption ? filterOption(option, search) : [option.label, ...(allowCustomValue ? [option.value] : [])].some(text => text.toLowerCase().includes(search.toLowerCase()))))
  const listId = `${id}-options`
  const expanded = open && !disabled

  useEffect(() => {
    input.current.setCustomValidity(required && !allowCustomValue && !selected ? `Choose a ${label.toLowerCase()} from the options.` : '')
  }, [required, selected, allowCustomValue, label])
  useEffect(() => {
    const outside = event => { if (!container.current.contains(event.target)) setOpen(false) }
    document.addEventListener('pointerdown', outside)
    return () => document.removeEventListener('pointerdown', outside)
  }, [])
  useEffect(() => {
    if (expanded && active >= 0) document.getElementById(`${id}-option-${active}`)?.scrollIntoView({ block:'nearest' })
  }, [expanded, active, id])

  const choose = option => {
    onChange(option.value)
    setQuery(null); setOpen(false); setActive(-1)
    input.current.focus()
  }
  const keyDown = event => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault(); setOpen(true)
      setActive(current => {
        if (!matches.length) return -1
        if (!expanded || current < 0) return event.key === 'ArrowDown' ? 0 : matches.length - 1
        return (current + (event.key === 'ArrowDown' ? 1 : -1) + matches.length) % matches.length
      })
    } else if (event.key === 'Enter' && expanded) {
      event.preventDefault()
      if (matches[active]) choose(matches[active])
      else if (matches.length === 1) choose(matches[0])
      else if (allowCustomValue) setOpen(false)
    } else if (event.key === 'Escape' && expanded) {
      event.preventDefault(); event.stopPropagation(); setOpen(false)
    } else if (event.key === 'Tab') setOpen(false)
  }

  return <div className="grid gap-1.5">
    <label htmlFor={id} className="text-sm font-medium">{label}{required && ' *'}</label>
    <div className="relative" ref={container} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) { setOpen(false); if (allowCustomValue) setQuery(null); onBlur?.(event) } }}>
      <Input ref={input} id={id} role="combobox" aria-autocomplete="list" aria-expanded={expanded} aria-controls={expanded ? listId : undefined} aria-activedescendant={expanded && matches[active] ? `${id}-option-${active}` : undefined} aria-invalid={!!error} aria-describedby={description || error ? `${id}-description` : undefined} autoComplete="off" placeholder={placeholder} disabled={disabled} required={required} className="pr-10" value={allowCustomValue ? value || '' : query ?? selected?.label ?? ''}
        onFocus={() => { setOpen(true); setActive(-1) }}
        onClick={() => setOpen(true)}
        onChange={event => { setQuery(event.target.value); setOpen(true); setActive(-1); if (allowCustomValue) onChange(event.target.value); else if (value) onChange(null) }}
        onKeyDown={keyDown}
      />
      <IconChevronDown size={17} aria-hidden="true" className="pointer-events-none absolute right-3 top-3.5 text-muted-foreground" />
      {name && <input type="hidden" name={name} value={selected?.value || ''} disabled={disabled} />}
      {expanded && <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-60 overflow-y-auto overscroll-contain rounded-md border bg-popover p-1 text-popover-foreground shadow-lg">
        <ul id={listId} role="listbox" aria-label={`${label} options`}>
          {matches.map((option, index) => <li key={option.value} role="none"><button type="button" role="option" id={`${id}-option-${index}`} aria-selected={option.value === value} tabIndex={-1} className={`flex w-full items-center justify-between gap-3 rounded px-3 py-2.5 text-left text-sm ${active === index ? 'bg-accent' : 'hover:bg-accent'}`} onMouseDown={event => event.preventDefault()} onMouseEnter={() => setActive(index)} onClick={() => choose(option)}>{allowCustomValue ? <span><strong className="block font-semibold">{option.value}</strong>{option.label !== option.value && <span className="block text-xs text-muted-foreground">{option.label}</span>}</span> : option.label}{option.value === value && <IconCheck size={16} aria-hidden="true" className="shrink-0 text-primary" />}</button></li>)}
        </ul>
        {!matches.length && <p role="status" className="px-3 py-3 text-sm text-muted-foreground">{nothingFoundMessage}</p>}
      </div>}
    </div>
    {(description || error) && <p id={`${id}-description`} className={error ? 'text-sm text-destructive' : 'text-sm text-muted-foreground'} role={error ? 'alert' : undefined}>{error || description}</p>}
  </div>
}
