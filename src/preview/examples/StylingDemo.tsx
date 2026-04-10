import { DataGrid } from '@/components/DataGrid'
import type { ColumnType } from '@/components/DataGrid'
import { EMPLOYEE_DATA, type Employee } from '@/preview/mockData'
import { DemoBlock } from '@/preview/components/DemoBlock'

const columns: ColumnType<Employee>[] = [
  { key: 'id', title: 'ID', dataIndex: 'id', width: 70 },
  { key: 'name', title: '이름', dataIndex: 'name', width: 100 },
  { key: 'dept', title: '부서', dataIndex: 'dept', width: 90 },
  { key: 'team', title: '팀', dataIndex: 'team', width: 90 },
  { key: 'position', title: '직급', dataIndex: 'position', width: 90 },
  { key: 'level', title: '레벨', dataIndex: 'level', width: 100 },
  { key: 'salary', title: '연봉(만)', dataIndex: 'salary', width: 110, align: 'right' },
  { key: 'age', title: '나이', dataIndex: 'age', width: 70, align: 'center' },
  { key: 'city', title: '도시', dataIndex: 'city', width: 90 },
  { key: 'status', title: '상태', dataIndex: 'status', width: 80 },
  { key: 'score', title: '점수', dataIndex: 'score', width: 80, align: 'center' },
  { key: 'grade', title: '등급', dataIndex: 'grade', width: 70, align: 'center' },
  { key: 'project', title: '프로젝트', dataIndex: 'project', width: 110 },
  { key: 'budget', title: '예산(만)', dataIndex: 'budget', width: 110, align: 'right' },
  { key: 'revenue', title: '매출(만)', dataIndex: 'revenue', width: 110, align: 'right' },
  { key: 'profitRate', title: '수익률(%)', dataIndex: 'profitRate', width: 110, align: 'right' },
  { key: 'manager', title: '매니저', dataIndex: 'manager', width: 100 },
  { key: 'joinDate', title: '입사일', dataIndex: 'joinDate', width: 110 },
  { key: 'memo', title: '메모', dataIndex: 'memo', width: 180, ellipsis: true },
]

const DARK_CODE = `// style prop에 CSS 커스텀 프로퍼티 전달 → 인스턴스별 테마
<DataGrid
  style={{
    '--grid-header-bg': '#001529',
    '--grid-header-color': 'rgba(255,255,255,0.85)',
    '--grid-row-focus-bg': '#bae0ff',
    '--grid-border-color': '#1677ff',
  } as React.CSSProperties}
  dataSource={EMPLOYEE_DATA}
  columns={columns}
/>`

const HEIGHT_CODE = `{/* 부모 height만 지정하면 DataGrid가 100%를 채웁니다 */}
<div style={{ height: 300 }}>
  <DataGrid dataSource={EMPLOYEE_DATA} columns={columns} />
</div>`

const SCSS_CODE = `// src/styles/_variables.scss — 전역 테마 변경
$grid-header-bg: #001529;
$grid-header-color: rgba(255, 255, 255, 0.85);
$grid-row-focus-bg: #bae0ff;

// 특정 인스턴스만 변경 (SCSS)
.my-custom-grid {
  --grid-header-bg: #52c41a;
  --grid-row-hover-bg: #f6ffed;
}`

export function StylingDemo() {
  return (
    <div className="demo-page">
      <h1 className="demo-page__title">스타일 커스터마이징</h1>
      <p className="demo-page__desc">
        SCSS 변수 또는 CSS 커스텀 프로퍼티(style prop)로 색상 및 레이아웃을 자유롭게 변경합니다. 아래 예제는 모두
        10,000건 × 19컬럼 데이터를 사용합니다.
      </p>

      <DemoBlock title="다크 헤더 테마" description="CSS 커스텀 프로퍼티를 style prop으로 전달" code={DARK_CODE}>
        <div style={{ height: 420 }}>
          <DataGrid<Employee>
            style={
              {
                '--grid-header-bg': '#001529',
                '--grid-header-color': 'rgba(255,255,255,0.85)',
                '--grid-row-focus-bg': '#bae0ff',
                '--grid-border-color': '#1677ff',
              } as React.CSSProperties
            }
            dataSource={EMPLOYEE_DATA}
            columns={columns}
            rowKey="id"
            pagination={{
              pageSize: 50,
              showSizeChanger: true,
              pageSizeOptions: [50, 100, 200],
              showTotal: (total, [s, e]) => `${s}-${e} / 총 ${total}건`,
            }}
          />
        </div>
      </DemoBlock>

      <DemoBlock
        title="높이 자동 (부모 100%)"
        description="부모 컨테이너 height를 지정하면 DataGrid가 꽉 채웁니다"
        code={HEIGHT_CODE}
      >
        <div style={{ height: 300, border: '2px dashed #e8e8e8', borderRadius: 4 }}>
          <DataGrid<Employee>
            dataSource={EMPLOYEE_DATA}
            columns={columns}
            rowKey="id"
            pagination={{
              pageSize: 50,
              showSizeChanger: true,
              pageSizeOptions: [50, 100, 200],
            }}
          />
        </div>
      </DemoBlock>

      <DemoBlock title="SCSS 변수 오버라이드 방법" description="전역/인스턴스 테마 변경 SCSS 패턴" code={SCSS_CODE}>
        <div
          style={{
            padding: '14px 16px',
            background: '#fafafa',
            borderRadius: 4,
            fontSize: 13,
            color: 'rgba(0,0,0,.65)',
          }}
        >
          <p style={{ margin: 0 }}>
            📌 <code>src/styles/_variables.scss</code>에서 변수를 수정하면 <strong>모든 DataGrid 인스턴스</strong>에
            적용됩니다.
          </p>
          <p style={{ margin: '8px 0 0' }}>
            📌 특정 인스턴스만 변경하려면 <code>style</code> prop에 CSS 커스텀 프로퍼티를 전달하거나,
            <code>className</code>을 지정하고 SCSS에서 해당 클래스를 오버라이드하세요.
          </p>
        </div>
      </DemoBlock>
    </div>
  )
}
