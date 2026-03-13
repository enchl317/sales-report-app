# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.0.0] - 2026-03-13

### Added
- 用户认证系统，支持员工和管理员角色
- 门店管理功能，支持6家门店（南东店、杨浦店、中环店、三鑫店、全土店、汇联店）
- 销售数据录入功能，支持日常销售报告提交
- 年度销售汇总页面，支持按门店和月份查看销售数据
- 月度目标管理功能，支持设置和查看月度销售目标
- 达成率计算和显示功能
- 响应式设计，支持移动端访问
- 数据库初始化脚本，包含完整的表结构和初始数据
- API 接口，支持前后端分离架构

### Changed
- 从 antd-mobile 迁移到原生 HTML 组件以提高性能
- 优化数据库查询性能
- 改进错误处理机制

### Fixed
- 解决了模块解析错误（buffer, tls 等）
- 修复了认证逻辑中的错误处理
- 修复了数据库事务支持问题
- 修复了重复提交数据的问题

### Security
- 实施参数化查询防止 SQL 注入
- 加强密码哈希处理