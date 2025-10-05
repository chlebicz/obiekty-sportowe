import { useState } from 'react';

/**
 * Represents a single tab in the TabbedSelector component.
 */
export interface Tab {
  /** The display name of the tab. */
  name: string;

  /** All possible checkbox options for this tab. */
  options: string[];

  /** The currently selected options for this tab. */
  selected: string[];
}

function TabbedSelectorHeader({ tabs, activeIndex, onTabClick }: {
  tabs: string[], activeIndex?: number, onTabClick: (index: number) => any
}) {
  return (
    <div className='flex justify-between bg-gray-100 rounded-lg p-1 mb-3'>
      {tabs.map((tab, i) => (
        <button
          className={`
            flex-1 py-1.5 rounded-md text-sm transition-colors cursor-pointer
            ${activeIndex === i
              ? 'bg-white shadow text-blue-600 font-medium'
              : 'text-gray-500 hover:text-gray-700'}
          `}
          onClick={() => onTabClick(i)}
          key={tab}
        >
          {tab}
        </button>
      ))}
    </div>
  )
}

export function CheckboxItem({ label, checked, onChange, type }: {
  label: string,
  checked: boolean,
  onChange: (checked: boolean) => any,
  type?: string
}) {
  return (
    <label
      className='flex items-center gap-3 text-sm cursor-pointer select-none'
    >
      <input
        type='checkbox'
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className='h-4 w-4 rounded border-gray-300 text-blue-500
          focus:ring-0 cursor-pointer'
      />
      <span className='flex-1'>{label}</span>
      {type &&
        <span className='text-gray-400 text-xs italic mr-1'>
          {type}
        </span>}
    </label>
  );
}

function CheckboxList({ options, selected, onChange }: {
  options: string[],
  selected: string[],
  onChange: (option: string, selected: boolean) => any
}) {
  return (
    <div className='max-h-40 overflow-y-auto space-y-2'>
      {options.map((item) => (
        <CheckboxItem
          label={item}
          checked={selected.includes(item)}
          onChange={checked => onChange(item, checked)}
          key={item}
        />
      ))}
    </div>
  );
}

/**
 * A component that renders a set of tabs, each containing a list of checkboxes.
 * 
 * @param props - Component props.
 * @param props.tabs - The list of tabs, where each tab contains a name,
 * available options, and selected options.
 * @param props.onTabContentChange - Callback fired when the selection
 * in a tab changes.
 *   - Receives the tab's `name` and the updated list of `selected` options.
 * 
 * @example
 * ```tsx
 * const [tabs, setTabs] = useState<Tab[]>([
 *   { name: 'Fruits', options: ['Apple', 'Banana'], selected: ['Banana'] },
 *   { name: 'Vegetables', options: ['Carrot', 'Lettuce'], selected: [] }
 * ]);
 *
 * <TabbedSelector
 *   tabs={tabs}
 *   onTabContentChange={(tabName, selected) => {
 *     setTabs(prev =>
 *       prev.map(t =>
 *         t.name === tabName ? { ...t, selected } : t
 *       )
 *     );
 *   }}
 * />
 * ```
 */
export default function TabbedSelector({ tabs, onTabContentChange }: {
  tabs: Tab[],
  onTabContentChange: (tab: string, selected: string[]) => any
}) {
  const [activeTab, setActiveTab] = useState(0);

  if (tabs.length === 0)
    return null;

  const tabNames = tabs.map(tab => tab.name);

  const handleCheckboxChange = (option: string, checked: boolean) => {
    const { name, selected } = tabs[activeTab];
    let newSelected;
    if (checked)
      newSelected = [...selected, option];
    else
      newSelected = selected.filter(v => v !== option);

    onTabContentChange(name, newSelected);
  }

  return (
    <>
      <TabbedSelectorHeader
        tabs={tabNames}
        activeIndex={activeTab}
        onTabClick={setActiveTab}
      />
      <CheckboxList
        options={tabs[activeTab].options}
        selected={tabs[activeTab].selected}
        onChange={handleCheckboxChange}
      />
    </>
  );
}