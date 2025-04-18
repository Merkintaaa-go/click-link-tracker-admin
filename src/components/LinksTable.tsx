
import { useState } from 'react';
import { Table, Card, Button, Typography, Modal, Descriptions, Badge } from 'antd';
import { useQuery } from '@tanstack/react-query';
import { getLinks, getLinkStats, Link } from '../api';
import { BarChartOutlined } from '@ant-design/icons';

const { Title } = Typography;

const LinksTable: React.FC = () => {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [statsModalVisible, setStatsModalVisible] = useState(false);
  const [selectedLinkId, setSelectedLinkId] = useState<number | null>(null);

  // Fetch links data
  const { data, isLoading } = useQuery({
    queryKey: ['links', page, pageSize],
    queryFn: () => getLinks({ page, pageSize }),
  });

  // Fetch stats for selected link
  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['linkStats', selectedLinkId],
    queryFn: () => selectedLinkId ? getLinkStats(selectedLinkId) : null,
    enabled: !!selectedLinkId,
  });

  // View stats for a link
  const showStats = (linkId: number) => {
    setSelectedLinkId(linkId);
    setStatsModalVisible(true);
  };

  // Table columns
  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: 'Code',
      dataIndex: 'code',
      key: 'code',
      width: 120,
    },
    {
      title: 'White URL',
      dataIndex: 'white_url',
      key: 'white_url',
      ellipsis: true,
      render: (url: string) => (
        <a href={url} target="_blank" rel="noopener noreferrer">
          {url}
        </a>
      ),
    },
    {
      title: 'Black URL',
      dataIndex: 'black_url',
      key: 'black_url',
      ellipsis: true,
      render: (url: string) => (
        <a href={url} target="_blank" rel="noopener noreferrer">
          {url}
        </a>
      ),
    },
    {
      title: 'Created',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
      render: (date: string) => new Date(date).toLocaleString(),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      render: (_: any, record: Link) => (
        <Button 
          type="primary" 
          icon={<BarChartOutlined />} 
          onClick={() => showStats(record.id)}
        >
          Stats
        </Button>
      ),
    },
  ];

  return (
    <>
      <Card>
        <Title level={3}>Link Management</Title>
        <Table
          rowKey="id"
          dataSource={data?.data || []}
          columns={columns}
          loading={isLoading}
          pagination={{
            current: page,
            pageSize: pageSize,
            total: data?.pagination?.total || 0,
            showSizeChanger: true,
            onChange: (page, pageSize) => {
              setPage(page);
              setPageSize(pageSize);
            },
          }}
          scroll={{ x: 'max-content' }}
        />
      </Card>

      <Modal
        title="Link Statistics"
        open={statsModalVisible}
        onCancel={() => setStatsModalVisible(false)}
        footer={null}
        width={700}
      >
        {statsLoading ? (
          <div>Loading statistics...</div>
        ) : statsData ? (
          <Descriptions bordered column={1}>
            <Descriptions.Item label="Total Clicks">
              <Badge count={statsData.total_clicks} showZero style={{ backgroundColor: '#1890ff' }} />
            </Descriptions.Item>
            <Descriptions.Item label="Bot Clicks">
              <Badge count={statsData.bot_clicks} showZero style={{ backgroundColor: '#ff4d4f' }} />
            </Descriptions.Item>
            <Descriptions.Item label="Human Clicks">
              <Badge 
                count={statsData.total_clicks - statsData.bot_clicks} 
                showZero 
                style={{ backgroundColor: '#52c41a' }} 
              />
            </Descriptions.Item>
            <Descriptions.Item label="Clicks by Country">
              <Table
                dataSource={statsData.country_stats}
                columns={[
                  {
                    title: 'Country',
                    dataIndex: 'country',
                    key: 'country',
                    render: (country) => country || 'Unknown',
                  },
                  {
                    title: 'Clicks',
                    dataIndex: 'count',
                    key: 'count',
                    render: (count) => <Badge count={count} style={{ backgroundColor: '#1890ff' }} />,
                  },
                ]}
                pagination={false}
                size="small"
                rowKey="country"
              />
            </Descriptions.Item>
          </Descriptions>
        ) : (
          <div>No statistics available</div>
        )}
      </Modal>
    </>
  );
};

export default LinksTable;
