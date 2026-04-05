import { useState } from 'react'
import { DataGrid } from '@/components/DataGrid'
import type { ColumnType } from '@/components/DataGrid'
import { EMPLOYEE_DATA, type Employee } from '../mockData'
import { DemoBlock } from '../components/DemoBlock'

// ──────────────────────────────────────────────
// 그룹 헤더 예제 코드 스니펫
// ──────────────────────────────────────────────
const GROUP_HEADER_CODE = `// 그룹 헤더 — children으로 컬럼 계층 구성
const columns: ColumnType<Employee>[] = [
  {
    key: 'personal',
    title: '개인 정보',
    children: [
      { key: 'id',     title: 'ID',   dataIndex: 'id',     width: 70 },
      { key: 'name',   title: '이름', dataIndex: 'name',   width: 110 },
      { key: 'age',    title: '나이', dataIndex: 'age',    width: 70 },
      { key: 'gender', title: '성별', dataIndex: 'gender', width: 70 },
      { key: 'city',   title: '도시', dataIndex: 'city',   width: 90 },
    ],
  },
  {
    key: 'affiliation',
    title: '소속 정보',
    children: [
      { key: 'dept',     title: '부서', dataIndex: 'dept',     width: 90 },
      { key: 'team',     title: '팀',   dataIndex: 'team',     width: 90 },
      { key: 'position', title: '직급', dataIndex: 'position', width: 90 },
      { key: 'level',    title: '레벨', dataIndex: 'level',    width: 100 },
    ],
  },
]`

// ──────────────────────────────────────────────
// 리사이즈 예제 코드 스니펫
// ──────────────────────────────────────────────
const RESIZE_CODE = `// resizable + minWidth/maxWidth 제약
const columns: ColumnType<Employee>[] = [
  // resizable 기본값(true) — 제약 없음
  { key: 'id',   title: 'ID',   dataIndex: 'id',   width: 70 },
  // 최소 80px, 최대 300px 제약
  { key: 'name', title: '이름', dataIndex: 'name', width: 110,
    minWidth: 80, maxWidth: 300 },
  // resizable: false — 핸들 없음
  { key: 'dept', title: '부서', dataIndex: 'dept', width: 100,
    resizable: false },
]`

export function GroupHeaderResizeDemo() {
  // 그룹 헤더 예제 데이터
  const [groupData] = useState<Employee[]>(EMPLOYEE_DATA)

  // 리사이즈 예제 데이터
  const [resizeData] = useState<Employee[]>(EMPLOYEE_DATA)

  // ── 그룹 헤더 컬럼 정의 ──────────────────────
  const groupColumns: ColumnType<Employee>[] = [
    {
      key: 'personal',
      title: '개인 정보',
      children: [
        { key: 'id',     title: 'ID',   dataIndex: 'id',     width: 70,  align: 'center' },
        { key: 'name',   title: '이름', dataIndex: 'name',   width: 110 },
        { key: 'age',    title: '나이', dataIndex: 'age',    width: 70,  align: 'center' },
        { key: 'gender', title: '성별', dataIndex: 'gender', width: 70,  align: 'center' },
        { key: 'city',   title: '도시', dataIndex: 'city',   width: 90 },
      ],
    },
    {
      key: 'affiliation',
      title: '소속 정보',
      children: [
        { key: 'dept',     title: '부서', dataIndex: 'dept',     width: 90 },
        { key: 'team',     title: '팀',   dataIndex: 'team',     width: 90 },
        { key: 'position', title: '직급', dataIndex: 'position', width: 90 },
        { key: 'level',    title: '레벨', dataIndex: 'level',    width: 100 },
      ],
    },
    {
      key: 'salary_info',
      title: '급여 정보',
      children: [
        { key: 'salary',     title: '연봉(만)', dataIndex: 'salary',     width: 110, align: 'right', sorter: true },
        { key: 'bonus',      title: '보너스',   dataIndex: 'bonus',      width: 100, align: 'right' },
        { key: 'profitRate', title: '수익률(%)', dataIndex: 'profitRate', width: 110, align: 'right' },
      ],
    },
    {
      key: 'evaluation',
      title: '평가',
      children: [
        { key: 'score', title: '점수', dataIndex: 'score', width: 80,  align: 'center', sorter: true },
        { key: 'grade', title: '등급', dataIndex: 'grade', width: 70,  align: 'center' },
      ],
    },
    { key: 'project', title: '프로젝트', dataIndex: 'project', width: 110 },
    { key: 'memo',    title: '메모',     dataIndex: 'memo',    width: 180, ellipsis: true },
  ]

  // ── 리사이즈 컬럼 정의 ──────────────────────
  const resizeColumns: ColumnType<Employee>[] = [
    {
      key: 'id',
      title: 'ID',
      dataIndex: 'id',
      width: 70,
      align: 'center',
      // resizable 기본값(true) — 제약 없음
    },
    {
      key: 'name',
      title: '이름',
      dataIndex: 'name',
      width: 110,
      minWidth: 80,
      maxWidth: 300,
    },
    {
      key: 'email',
      title: '이메일',
      dataIndex: 'email',
      width: 200,
      minWidth: 100,
      maxWidth: 400,
      ellipsis: true,
    },
    {
      key: 'dept',
      title: '부서',
      dataIndex: 'dept',
      width: 100,
      resizable: false, // 리사이즈 비활성화
    },
    {
      key: 'position',
      title: '직급',
      dataIndex: 'position',
      width: 90,
      minWidth: 60,
      maxWidth: 200,
    },
    {
      key: 'level',
      title: '레벨',
      dataIndex: 'level',
      width: 100,
      minWidth: 70,
    },
    {
      key: 'salary',
      title: '연봉(만)',
      dataIndex: 'salary',
      width: 110,
      align: 'right',
      minWidth: 80,
      maxWidth: 200,
      sorter: true,
    },
    {
      key: 'score',
      title: '점수',
      dataIndex: 'score',
      width: 80,
      align: 'center',
      minWidth: 60,
      maxWidth: 150,
      sorter: true,
    },
    {
      key: 'grade',
      title: '등급',
      dataIndex: 'grade',
      width: 70,
      align: 'center',
      resizable: false, // 리사이즈 비활성화
    },
    {
      key: 'city',
      title: '도시',
      dataIndex: 'city',
      width: 90,
    },
    {
      key: 'joinDate',
      title: '입사일',
      dataIndex: 'joinDate',
      width: 110,
      minWidth: 90,
    },
    {
      key: 'memo',
      title: '메모',
      dataIndex: 'memo',
      width: 180,
      ellipsis: true,
      minWidth: 100,
      maxWidth: 400,
    },
  ]

  return (
    <div className="demo-page">
      <h1 className="demo-page__title">그룹 헤더 &amp; 헤더 리사이즈</h1>
      <p className="demo-page__desc">
        <code>children</code>으로 컬럼 계층(그룹 헤더)을 구성하고,
        <code>resizable</code> / <code>minWidth</code> / <code>maxWidth</code>로
        헤더 드래그 리사이즈를 제어합니다.
      </p>

      {/* 그룹 헤더 예제 */}
      <DemoBlock
        title="그룹 헤더 (children)"
        description="개인 정보·소속 정보·급여 정보·평가 그룹으로 컬럼을 묶었습니다. 10,000건 데이터."
        code={GROUP_HEADER_CODE}
      >
        <div style={{ height: 500 }}>
          <DataGrid<Employee>
            dataSource={groupData}
            columns={groupColumns}
            rowKey="id"
            scroll={{ x: 1600 }}
            pagination={{
              pageSize: 50,
              showSizeChanger: true,
              pageSizeOptions: [50, 100, 200],
              showTotal: (total, [s, e]) => `${s}-${e} / 총 ${total}건`,
            }}
          />
        </div>
      </DemoBlock>

      {/* 리사이즈 예제 */}
      <DemoBlock
        title="헤더 리사이즈"
        description="헤더 오른쪽 경계를 드래그하여 컬럼 너비를 조절합니다. 일부 컬럼은 resizable: false로 비활성화되어 있습니다."
        code={RESIZE_CODE}
      >
        <p style={{ margin: '0 0 8px', fontSize: 12, color: 'rgba(0,0,0,.45)' }}>
          부서·등급 컬럼은 리사이즈 비활성화 |
          이름 컬럼: 80~300px |
          이메일 컬럼: 100~400px
        </p>
        <div style={{ height: 500 }}>
          <DataGrid<Employee>
            dataSource={resizeData}
            columns={resizeColumns}
            rowKey="id"
            scroll={{ x: 1400 }}
            pagination={{
              pageSize: 50,
              showSizeChanger: true,
              pageSizeOptions: [50, 100, 200],
              showTotal: (total, [s, e]) => `${s}-${e} / 총 ${total}건`,
            }}
          />
        </div>
      </DemoBlock>
    </div>
  )
}
