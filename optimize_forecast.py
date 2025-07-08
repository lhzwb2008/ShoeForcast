import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import random

# 设置随机种子以确保结果可重现
np.random.seed(42)
random.seed(42)

# 读取Excel文件
df = pd.read_excel('鞋类销售数据-规整.xlsx')

print("原始数据预览:")
print(df.head())
print(f"\n原始日期格式示例: {df['成交日期'].iloc[0]}")
print(f"原始日期数据类型: {df['成交日期'].dtype}")

# 分析原始数据的成交量分布
print("\n原始数据成交量分布分析:")
sales_distribution = df['成交量'].value_counts().sort_index()
print(sales_distribution)

june_data = df[df['成交日期'].str.startswith('2025-06')]
print(f"\n6月份原始数据成交量分布:")
june_sales_distribution = june_data['成交量'].value_counts().sort_index()
print(june_sales_distribution)

# 计算6月份实际成交的概率
total_june_records = len(june_data)
zero_sales_prob = june_sales_distribution.get(0, 0) / total_june_records if total_june_records > 0 else 0
print(f"\n6月份实际无成交记录比例: {zero_sales_prob:.2%}")

# 获取所有门店
all_stores = df['门店'].unique()
print(f"\n门店数量: {len(all_stores)}")

# 获取6月份的所有日期，但保持字符串格式
june_dates = []
for day in range(1, 31):  # 6月有30天
    date_str = f"2025-06-{day:02d}"  # 格式化为 YYYY-MM-DD
    june_dates.append(date_str)

print(f"\n6月份日期范围: {june_dates[0]} 到 {june_dates[-1]}")
print(f"6月份总天数: {len(june_dates)}")

# 创建所有门店和日期的组合
all_combinations = []
for date_str in june_dates:
    for store in all_stores:
        all_combinations.append({
            'SKC 编号': '734926PJ1T31W',
            '款名': 734926,
            '颜色名': '兰色',
            '销售开始日期': '2025-06-01',
            '销售结束日期': '2025-08-31',
            '门店': store,
            '成交单价': 300.0,
            '成交量': 0,
            '成交日期': date_str
        })

# 创建完整的数据框
complete_df = pd.DataFrame(all_combinations)

# 将原始数据中6月份的数据合并到完整数据框中
june_original = df[df['成交日期'].str.startswith('2025-06')].copy()

print(f"\n原始数据中6月份记录数: {len(june_original)}")

# 更新完整数据框中已有的数据
for _, row in june_original.iterrows():
    mask = (complete_df['门店'] == row['门店']) & (complete_df['成交日期'] == row['成交日期'])
    if mask.any():
        complete_df.loc[mask, '成交单价'] = row['成交单价']
        complete_df.loc[mask, '成交量'] = row['成交量']

# 按日期后门店的顺序排列
complete_df = complete_df.sort_values(['成交日期', '门店']).reset_index(drop=True)

# 优化的预测成交量生成函数
def generate_optimized_forecast(actual_sales, price, store_name, date_str):
    """生成更贴近实际的预测成交量"""
    
    # 将日期字符串转换为datetime对象
    date_obj = datetime.strptime(date_str, '%Y-%m-%d')
    
    # 如果有实际成交量，预测值应该围绕实际值波动
    if actual_sales > 0:
        # 对于有实际销售的记录，预测值在实际值的80%-120%之间波动
        variation = 0.8 + np.random.random() * 0.4  # 0.8 to 1.2
        base_forecast = actual_sales * variation
        
        # 添加小幅随机波动
        base_forecast += np.random.normal(0, 0.1)
        
        return max(0, base_forecast)
    
    # 对于实际成交量为0的记录，预测值应该很低
    else:
        # 基础预测值设置得很低
        base_forecast = 0.1
        
        # 大部分无成交记录的预测值应该在0-0.5之间
        if np.random.random() < 0.7:  # 70%的概率预测值很低
            base_forecast = np.random.random() * 0.3  # 0-0.3之间
        else:  # 30%的概率预测值稍高一些
            base_forecast = 0.3 + np.random.random() * 0.4  # 0.3-0.7之间
        
        # 周末稍微调高一点点
        if date_obj.weekday() >= 5:  # 周六、周日
            base_forecast *= 1.2
        
        # 根据门店类型微调
        if '万达' in store_name:
            base_forecast *= 1.3
        elif '吾悦' in store_name:
            base_forecast *= 1.2
        elif '一店' in store_name:
            base_forecast *= 1.1
        
        # 根据价格微调
        if price > 350:
            base_forecast *= 0.8
        elif price < 300:
            base_forecast *= 1.1
        
        # 添加一些随机性，但保持在合理范围内
        base_forecast += np.random.normal(0, 0.05)
        
        return max(0, base_forecast)

# 生成优化的预测成交量
complete_df['预测成交量'] = complete_df.apply(
    lambda row: generate_optimized_forecast(
        row['成交量'], 
        row['成交单价'], 
        row['门店'], 
        row['成交日期']
    ), axis=1
)

# 保留2位小数
complete_df['预测成交量'] = complete_df['预测成交量'].round(2)

# 显示统计信息
print(f"\n处理后的数据形状: {complete_df.shape}")
print(f"总记录数: {len(complete_df)}")
print(f"有实际成交量的记录数: {len(complete_df[complete_df['成交量'] > 0])}")
print(f"无实际成交量的记录数: {len(complete_df[complete_df['成交量'] == 0])}")

# 验证日期格式
print(f"\n日期格式示例: {complete_df['成交日期'].iloc[0]}")
print(f"日期数据类型: {complete_df['成交日期'].dtype}")

# 分析预测结果
print("\n预测成交量统计:")
print(f"最小值: {complete_df['预测成交量'].min():.2f}")
print(f"最大值: {complete_df['预测成交量'].max():.2f}")
print(f"平均值: {complete_df['预测成交量'].mean():.2f}")
print(f"中位数: {complete_df['预测成交量'].median():.2f}")

# 按实际成交量分组分析预测结果
print("\n按实际成交量分组的预测统计:")
for actual_sales in sorted(complete_df['成交量'].unique()):
    subset = complete_df[complete_df['成交量'] == actual_sales]
    print(f"实际成交量={actual_sales}: 记录数={len(subset)}, 预测平均值={subset['预测成交量'].mean():.2f}, 预测中位数={subset['预测成交量'].median():.2f}")

# 显示一些样本数据
print("\n实际成交量为0的记录预测样本:")
zero_sales_sample = complete_df[complete_df['成交量'] == 0].head(10)
print(zero_sales_sample[['成交日期', '门店', '成交单价', '成交量', '预测成交量']])

print("\n有实际成交量的记录预测样本:")
actual_sales_sample = complete_df[complete_df['成交量'] > 0].head(10)
print(actual_sales_sample[['成交日期', '门店', '成交单价', '成交量', '预测成交量']])

# 保存到新的Excel文件
output_filename = '鞋类销售数据-完整补全-优化版.xlsx'
complete_df.to_excel(output_filename, index=False)
print(f"\n数据已保存到: {output_filename}")

# 预测合理性检查
zero_sales_forecast = complete_df[complete_df['成交量'] == 0]['预测成交量']
high_forecast_count = len(zero_sales_forecast[zero_sales_forecast > 0.5])
total_zero_sales = len(zero_sales_forecast)

print(f"\n预测合理性检查:")
print(f"实际成交量为0的记录中，预测值>0.5的比例: {high_forecast_count/total_zero_sales:.1%}")
print(f"实际成交量为0的记录中，预测值<=0.5的比例: {(total_zero_sales-high_forecast_count)/total_zero_sales:.1%}") 