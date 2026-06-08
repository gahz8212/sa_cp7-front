'use client'

import { useState } from 'react'
import {
  Button,
  Input,
  Textarea,
  Select,
  Checkbox,
  Radio,
  Link,
  Text,
  Heading,
  Label,
  Image,
  Icon,
  Badge,
  Chip,
  Divider,
  Spinner,
} from '@cp7/ui'

const SECTION = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="mb-12">
    <h2 className="mb-4 text-xl font-bold text-gray-800 border-b pb-2">{title}</h2>
    <div className="space-y-4">{children}</div>
  </section>
)

const Row = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div>
    <p className="mb-2 text-xs text-gray-500">{label}</p>
    <div className="flex flex-wrap items-center gap-3">{children}</div>
  </div>
)

export default function UiKitPage() {
  const [selectSm, setSelectSm] = useState('')
  const [selectMd, setSelectMd] = useState('')
  const [selectLg, setSelectLg] = useState('')
  const [checked, setChecked] = useState(false)
  const [checkedMd, setCheckedMd] = useState(true)

  const selectOptions = [
    { value: 'apple', label: '사과' },
    { value: 'banana', label: '바나나' },
    { value: 'cherry', label: '체리', disabled: true },
  ]

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <div className="mb-6">
        <Link href="/test" variant="muted">← 테스트 목록</Link>
      </div>
      <Heading level={1} className="mb-8">
        UI Kit — Atoms
      </Heading>

      {/* Button */}
      <SECTION title="Button">
        <Row label="variants (md)">
          <Button variant="primary">Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="danger">Danger</Button>
        </Row>
        <Row label="sizes (primary)">
          <Button size="sm">Small</Button>
          <Button size="md">Medium</Button>
          <Button size="lg">Large</Button>
        </Row>
        <Row label="loading / disabled">
          <Button loading>Loading</Button>
          <Button disabled>Disabled</Button>
        </Row>
      </SECTION>

      <Divider />

      {/* Input */}
      <SECTION title="Input">
        <Row label="sizes">
          <Input size="sm" placeholder="Small input" className="w-48" />
          <Input size="md" placeholder="Medium input" className="w-48" />
          <Input size="lg" placeholder="Large input" className="w-48" />
        </Row>
        <Row label="statuses">
          <Input status="default" placeholder="Default" className="w-48" />
          <Input status="error" placeholder="Error" className="w-48" />
          <Input status="success" defaultValue="Success" className="w-48" />
        </Row>
        <Row label="disabled">
          <Input disabled placeholder="Disabled input" className="w-48" />
        </Row>
        <Row label="autoWidth">
          <Input autoWidth placeholder="Auto width..." defaultValue="Narrow" />
          <Input autoWidth defaultValue="This input expands based on its content length" />
        </Row>
      </SECTION>

      <Divider />

      {/* Textarea */}
      <SECTION title="Textarea">
        <Row label="sizes">
          <Textarea size="sm" placeholder="Small textarea" className="w-48" />
          <Textarea size="md" placeholder="Medium textarea" className="w-48" />
          <Textarea size="lg" placeholder="Large textarea" className="w-48" />
        </Row>
        <Row label="statuses">
          <Textarea status="default" placeholder="Default" className="w-48" />
          <Textarea status="error" placeholder="Error" className="w-48" />
          <Textarea status="success" defaultValue="Success" className="w-48" />
        </Row>
      </SECTION>

      <Divider />

      {/* Select */}
      <SECTION title="Select">
        <Row label="sm">
          <Select
            size="sm"
            options={selectOptions}
            value={selectSm}
            onChange={setSelectSm}
            placeholder="Small"
            className="w-40"
          />
        </Row>
        <Row label="md">
          <Select
            size="md"
            options={selectOptions}
            value={selectMd}
            onChange={setSelectMd}
            placeholder="Medium"
            className="w-40"
          />
        </Row>
        <Row label="lg">
          <Select
            size="lg"
            options={selectOptions}
            value={selectLg}
            onChange={setSelectLg}
            placeholder="Large"
            className="w-40"
          />
        </Row>
      </SECTION>

      <Divider />

      {/* Checkbox */}
      <SECTION title="Checkbox">
        <Row label="sizes">
          <Checkbox size="sm" aria-label="sm checkbox" />
          <Checkbox size="md" aria-label="md checkbox" />
          <Checkbox size="lg" aria-label="lg checkbox" />
        </Row>
        <Row label="checked / unchecked (controlled)">
          <Checkbox
            size="md"
            checked={checked}
            onCheckedChange={(val) => setChecked(val === true)}
            aria-label="toggle"
          />
          <span className="text-sm text-gray-500">{checked ? 'checked' : 'unchecked'}</span>
        </Row>
        <Row label="checked (md)">
          <Checkbox
            size="md"
            checked={checkedMd}
            onCheckedChange={(val) => setCheckedMd(val === true)}
            aria-label="checked md"
          />
        </Row>
        <Row label="disabled">
          <Checkbox size="md" disabled aria-label="disabled unchecked" />
          <Checkbox size="md" disabled defaultChecked aria-label="disabled checked" />
        </Row>
      </SECTION>

      <Divider />

      {/* Radio */}
      <SECTION title="Radio">
        <Row label="sizes (standalone)">
          <Radio size="sm" value="sm" aria-label="radio sm" />
          <Radio size="md" value="md" aria-label="radio md" />
          <Radio size="lg" value="lg" aria-label="radio lg" />
        </Row>
        <Row label="disabled">
          <Radio size="md" value="disabled" disabled aria-label="radio disabled" />
        </Row>
      </SECTION>

      <Divider />

      {/* Link */}
      <SECTION title="Link">
        <Row label="variants">
          <Link href="/test/ui-kit" variant="default">Default Link</Link>
          <Link href="/test/ui-kit" variant="underline">Underline Link</Link>
          <Link href="/test/ui-kit" variant="muted">Muted Link</Link>
        </Row>
        <Row label="external">
          <Link href="https://nextjs.org" external>External Link ↗</Link>
        </Row>
      </SECTION>

      <Divider />

      {/* Text */}
      <SECTION title="Text">
        <Row label="sizes">
          <Text size="xs">xs text</Text>
          <Text size="sm">sm text</Text>
          <Text size="md">md text</Text>
          <Text size="lg">lg text</Text>
          <Text size="xl">xl text</Text>
        </Row>
        <Row label="weights">
          <Text weight="normal">Normal</Text>
          <Text weight="medium">Medium</Text>
          <Text weight="semibold">Semibold</Text>
          <Text weight="bold">Bold</Text>
        </Row>
      </SECTION>

      <Divider />

      {/* Heading */}
      <SECTION title="Heading">
        <Heading level={1}>H1 Heading</Heading>
        <Heading level={2}>H2 Heading</Heading>
        <Heading level={3}>H3 Heading</Heading>
        <Heading level={4}>H4 Heading</Heading>
        <Heading level={5}>H5 Heading</Heading>
        <Heading level={6}>H6 Heading</Heading>
      </SECTION>

      <Divider />

      {/* Label */}
      <SECTION title="Label">
        <Row label="sizes">
          <Label size="sm">Small Label</Label>
          <Label size="md">Medium Label</Label>
          <Label size="lg">Large Label</Label>
        </Row>
        <Row label="required">
          <Label size="md" required>Required Field</Label>
        </Row>
      </SECTION>

      <Divider />

      {/* Image */}
      <SECTION title="Image">
        <Row label="rounded variants">
          <Image src="https://placehold.co/80x80" width={80} height={80} alt="none" unoptimized rounded="none" />
          <Image src="https://placehold.co/80x80" width={80} height={80} alt="sm" unoptimized rounded="sm" />
          <Image src="https://placehold.co/80x80" width={80} height={80} alt="md" unoptimized rounded="md" />
          <Image src="https://placehold.co/80x80" width={80} height={80} alt="lg" unoptimized rounded="lg" />
          <Image src="https://placehold.co/80x80" width={80} height={80} alt="full" unoptimized rounded="full" />
        </Row>
      </SECTION>

      <Divider />

      {/* Icon */}
      <SECTION title="Icon">
        <Row label="sizes">
          <Icon size="xs"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></Icon>
          <Icon size="sm"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></Icon>
          <Icon size="md"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></Icon>
          <Icon size="lg"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></Icon>
          <Icon size="xl"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></Icon>
        </Row>
      </SECTION>

      <Divider />

      {/* Badge */}
      <SECTION title="Badge">
        <Row label="variants (md)">
          <Badge variant="default">Default</Badge>
          <Badge variant="success">Success</Badge>
          <Badge variant="warning">Warning</Badge>
          <Badge variant="error">Error</Badge>
          <Badge variant="info">Info</Badge>
        </Row>
        <Row label="variants (sm)">
          <Badge variant="default" size="sm">Default</Badge>
          <Badge variant="success" size="sm">Success</Badge>
          <Badge variant="warning" size="sm">Warning</Badge>
          <Badge variant="error" size="sm">Error</Badge>
          <Badge variant="info" size="sm">Info</Badge>
        </Row>
      </SECTION>

      <Divider />

      {/* Chip */}
      <SECTION title="Chip">
        <Row label="variants (md)">
          <Chip variant="default">Default</Chip>
          <Chip variant="primary">Primary</Chip>
          <Chip variant="success">Success</Chip>
          <Chip variant="warning">Warning</Chip>
          <Chip variant="error">Error</Chip>
          <Chip variant="info">Info</Chip>
        </Row>
        <Row label="variants (sm)">
          <Chip variant="default" size="sm">Default</Chip>
          <Chip variant="primary" size="sm">Primary</Chip>
          <Chip variant="success" size="sm">Success</Chip>
          <Chip variant="warning" size="sm">Warning</Chip>
          <Chip variant="error" size="sm">Error</Chip>
          <Chip variant="info" size="sm">Info</Chip>
        </Row>
        <Row label="onRemove (X 버튼)">
          <Chip onRemove={() => {}}>삭제 가능</Chip>
          <Chip variant="primary" onRemove={() => {}}>Primary</Chip>
          <Chip variant="success" size="sm" onRemove={() => {}}>Small</Chip>
        </Row>
        <Row label="onClick (클릭 가능)">
          <Chip onClick={() => alert('clicked')}>클릭</Chip>
          <Chip variant="primary" onClick={() => alert('clicked')}>Primary 클릭</Chip>
        </Row>
        <Row label="onClick + onRemove">
          <Chip onClick={() => alert('clicked')} onRemove={() => {}}>클릭 + 삭제</Chip>
          <Chip variant="primary" onClick={() => alert('clicked')} onRemove={() => {}}>Primary</Chip>
        </Row>
        <Row label="disabled">
          <Chip disabled>Disabled</Chip>
          <Chip disabled onRemove={() => {}}>Disabled + X</Chip>
          <Chip disabled onClick={() => alert('clicked')}>Disabled + 클릭</Chip>
        </Row>
      </SECTION>

      <Divider />

      {/* Divider */}
      <SECTION title="Divider">
        <Row label="horizontal">
          <div className="w-full">
            <Text>Above</Text>
            <Divider className="my-2" />
            <Text>Below</Text>
          </div>
        </Row>
        <Row label="vertical (in flex container)">
          <div className="flex h-8 items-center gap-3">
            <Text>Left</Text>
            <Divider orientation="vertical" />
            <Text>Right</Text>
          </div>
        </Row>
      </SECTION>

      <Divider />

      {/* Spinner */}
      <SECTION title="Spinner">
        <Row label="sizes">
          <Spinner size="sm" />
          <Spinner size="md" />
          <Spinner size="lg" />
        </Row>
      </SECTION>

      <Divider />

      <section className="mb-8">
        <Text size="sm" className="text-gray-400">
          <Link href="/test/date" variant="muted">Date Molecules (/test/date) →</Link>
        </Text>
      </section>
    </main>
  )
}
