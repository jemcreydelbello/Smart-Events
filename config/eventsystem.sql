-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Mar 10, 2026 at 06:26 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.0.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `eventsystem`
--

-- --------------------------------------------------------

--
-- Table structure for table `activity_logs`
--

CREATE TABLE `activity_logs` (
  `log_id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `action_type` varchar(100) NOT NULL,
  `entity_type` varchar(100) DEFAULT NULL,
  `entity_id` int(11) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `timestamp` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `admins`
--

CREATE TABLE `admins` (
  `admin_id` int(11) NOT NULL,
  `username` varchar(100) NOT NULL,
  `email` varchar(150) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `full_name` varchar(150) NOT NULL,
  `admin_image` varchar(255) DEFAULT NULL,
  `department_id` int(11) DEFAULT NULL,
  `status` enum('active','inactive') DEFAULT 'active',
  `last_login` datetime DEFAULT NULL,
  `login_attempts` int(11) DEFAULT 0,
  `locked_until` datetime DEFAULT NULL,
  `created_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `reset_token` varchar(255) DEFAULT NULL,
  `reset_expire` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `admins`
--

INSERT INTO `admins` (`admin_id`, `username`, `email`, `password_hash`, `full_name`, `admin_image`, `department_id`, `status`, `last_login`, `login_attempts`, `locked_until`, `created_by`, `created_at`, `updated_at`, `reset_token`, `reset_expire`) VALUES
(2, 'miwanneone', 'lasiter.agustin@gmail.com', '$2y$10$PcGy6lls2qDdsjbOnmCDV.8zvvvKPAYwmhgfCOlgCECq5VmMSrHkG', 'Miwanneone', 'admin_1772706945_4bae8e67.jpg', 1, 'active', '2026-02-18 15:16:48', 0, NULL, NULL, '2026-02-18 07:07:49', '2026-03-05 10:35:45', '4577464a065bad5f72926ad8172a08b3', '2026-02-25 05:39:32'),
(4, 'jemcreydelbello', 'jemcreydelbello@gmail.com', '$2y$10$yqzsZgoi0nUiLGl/eTh5EueACKcwMh0pyFqbDd.VGsV191E6bdAPy', 'Luisa Pham', 'admin_1772706309_afc78974.jpg', NULL, 'active', '2026-03-06 16:48:34', 0, NULL, NULL, '2026-03-04 16:29:38', '2026-03-06 08:48:34', NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `admin_login_logs`
--

CREATE TABLE `admin_login_logs` (
  `login_log_id` int(11) NOT NULL,
  `admin_id` int(11) NOT NULL,
  `login_time` timestamp NOT NULL DEFAULT current_timestamp(),
  `logout_time` datetime DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `success` tinyint(1) DEFAULT 1,
  `reason` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `admin_login_logs`
--

INSERT INTO `admin_login_logs` (`login_log_id`, `admin_id`, `login_time`, `logout_time`, `ip_address`, `user_agent`, `success`, `reason`) VALUES
(41, 4, '2026-03-04 17:11:32', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', 1, NULL),
(42, 4, '2026-03-05 08:03:35', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Code/1.109.5 Chrome/142.0.7444.265 Electron/39.3.0 Safari/537.36', 1, NULL),
(43, 4, '2026-03-06 03:37:30', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', 1, NULL),
(44, 4, '2026-03-06 04:07:32', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', 1, NULL),
(45, 4, '2026-03-06 08:30:40', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', 1, NULL),
(46, 4, '2026-03-06 08:48:34', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', 1, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `attendance_logs`
--

CREATE TABLE `attendance_logs` (
  `attendance_id` int(11) NOT NULL,
  `registration_id` int(11) NOT NULL,
  `scanned_by` int(11) NOT NULL,
  `scanned_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `audit_logs`
--

CREATE TABLE `audit_logs` (
  `audit_id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `action_type` varchar(100) NOT NULL,
  `action_description` text NOT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `catalogue`
--

CREATE TABLE `catalogue` (
  `catalogue_id` int(11) NOT NULL,
  `event_id` int(11) DEFAULT NULL,
  `is_manual` tinyint(1) DEFAULT 0,
  `event_name` varchar(200) NOT NULL,
  `event_date` datetime NOT NULL,
  `location` varchar(200) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `image_url` varchar(255) DEFAULT NULL,
  `is_private` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `is_published` tinyint(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `catalogue`
--

INSERT INTO `catalogue` (`catalogue_id`, `event_id`, `is_manual`, `event_name`, `event_date`, `location`, `description`, `image_url`, `is_private`, `created_at`, `is_published`) VALUES
(20, NULL, 0, 'Past Event', '2026-03-02 00:00:00', '12 Catanduanes', 'Designed and built with all the love in the world by the Bootstrap team with the help of our contributors.', 'cat_1773110669_69af858d044d3.png', 0, '2026-03-10 02:44:29', 0),
(21, 45, 0, '2026 Global Sprint & Stride', '2026-03-09 00:00:00', 'Riverside Park, Quezon City', 'Join us for a scenic 5K run/walk to promote health and wellness. Open to all employees and their families. T-shirts and refreshments provided.', 'run.webp', 0, '2026-03-10 03:13:26', 1),
(22, NULL, 1, 'Past Event', '2026-03-02 00:00:00', '12 Catanduanes', 'veveve', 'cat_1773112442_69af8c7a879f7.jpg', 0, '2026-03-10 03:14:02', 1),
(23, NULL, 1, 'Past Event', '2026-03-02 00:00:00', '12 Catanduanes', '', 'uploads/cat_1773112747_69af8dabb8534.jpg', 0, '2026-03-10 03:19:07', 0),
(24, NULL, 1, 'no dir', '2026-03-05 00:00:00', '12 Catanduanes', '', 'cat_1773113212_69af8f7c13b57.jpg', 0, '2026-03-10 03:26:52', 1);

-- --------------------------------------------------------

--
-- Table structure for table `catalogue_images`
--

CREATE TABLE `catalogue_images` (
  `image_id` int(11) NOT NULL,
  `catalogue_id` int(11) NOT NULL,
  `image_url` varchar(255) NOT NULL,
  `uploaded_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `coordinators`
--

CREATE TABLE `coordinators` (
  `coordinator_id` int(11) NOT NULL,
  `coordinator_name` varchar(150) NOT NULL,
  `email` varchar(150) NOT NULL,
  `contact_number` varchar(20) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `company` varchar(150) DEFAULT NULL,
  `job_title` varchar(150) DEFAULT NULL,
  `coordinator_image` varchar(255) DEFAULT NULL,
  `reset_token` varchar(255) DEFAULT NULL,
  `reset_expire` datetime DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 0,
  `password_hash` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `coordinators`
--

INSERT INTO `coordinators` (`coordinator_id`, `coordinator_name`, `email`, `contact_number`, `created_at`, `updated_at`, `company`, `job_title`, `coordinator_image`, `reset_token`, `reset_expire`, `is_active`, `password_hash`) VALUES
(3, 'Jane Smith', 'jane.coord@example.com', '09111222333', '2026-03-02 16:21:01', '2026-03-05 15:43:22', 'Intellismart', NULL, NULL, '147e74e18dd5be0105334ed9d8cea2c5', '2026-03-03 17:21:01', 1, NULL),
(4, 'Maria Garcia', 'maria.coord@example.com', '09876543210', '2026-03-02 16:22:28', '2026-03-05 10:32:59', 'Intellismart', NULL, 'coordinator_1772706779_bb501702.jpg', '652ad186347c1c65002f998094fc23b6', '2026-03-03 17:22:28', 1, NULL),
(7, 'Daniel Cameron', 'delapena.edrian.bsit@gmail.com', '+639764823140', '2026-03-04 16:02:34', '2026-03-05 10:28:05', 'Intellismart', NULL, 'coordinator_1772706485_801e95a7.jpg', '31ab95deafec6988d28d2a43e560765a', '2026-03-05 17:02:34', 1, NULL),
(8, 'Raven Leon', 'raven.coord@example.com', '09123456789', '2026-03-04 16:03:38', '2026-03-06 07:52:11', 'Intellismart', NULL, 'coordinator_1772706403_e736e215.jpg', 'af8c24901be9bf0df936d05fc9488611', '2026-03-06 09:52:11', 1, NULL),
(10, 'Alessandra Everett', 'bello.jemcreydel.bsit@gmail.com', '0993342123', '2026-03-04 16:30:37', '2026-03-06 08:31:45', 'Intellismart', NULL, 'coordinator_1772641837_3538ee58.jpg', 'ec95ad07147e45f5d9a81a19641dbb7f', '2026-03-06 10:31:45', 1, '$2y$10$ojUJGqLcHWb128u3Lx09S.GpPx4nFQryvw0DzAvz6l1fO8QQqyAVu'),
(11, 'Princess Fuller', 'princess.coord@example.com', '0993342123', '2026-03-05 03:28:30', '2026-03-05 08:11:48', 'Intellismart', NULL, 'coordinator_1772698308_bc51413e.jpg', '3beca92bc2e52d71fabbab473b2f5316', '2026-03-06 04:28:30', 1, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `departments`
--

CREATE TABLE `departments` (
  `department_id` int(11) NOT NULL,
  `department_name` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `email_blasts`
--

CREATE TABLE `email_blasts` (
  `email_id` int(11) NOT NULL,
  `event_id` int(11) NOT NULL,
  `email_blast_name` varchar(255) NOT NULL,
  `audience` varchar(255) NOT NULL,
  `details` text DEFAULT NULL,
  `status` enum('Draft','Scheduled','Sent','Cancelled') DEFAULT 'Draft',
  `scheduled_date` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `email_blasts`
--

INSERT INTO `email_blasts` (`email_id`, `event_id`, `email_blast_name`, `audience`, `details`, `status`, `scheduled_date`, `created_at`, `updated_at`) VALUES
(6, 46, 'Save the Date', 'All Prospects', 'This is yout time', 'Scheduled', '2026-03-07 03:57:00', '2026-03-06 07:57:41', '2026-03-06 07:58:09');

-- --------------------------------------------------------

--
-- Table structure for table `events`
--

CREATE TABLE `events` (
  `event_id` int(11) NOT NULL,
  `event_name` varchar(200) NOT NULL,
  `start_event` datetime NOT NULL,
  `end_event` datetime NOT NULL,
  `description` text DEFAULT NULL,
  `location` varchar(200) DEFAULT NULL,
  `image_url` varchar(255) DEFAULT NULL,
  `capacity` int(11) DEFAULT 0,
  `is_private` tinyint(1) DEFAULT 0,
  `registration_link` varchar(500) DEFAULT NULL,
  `website` varchar(500) DEFAULT NULL,
  `created_by` int(11) DEFAULT NULL,
  `coordinator_id` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `is_catalogue` tinyint(1) DEFAULT 0,
  `registration_start` datetime DEFAULT NULL,
  `registration_end` datetime DEFAULT NULL,
  `archived` tinyint(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `events`
--

INSERT INTO `events` (`event_id`, `event_name`, `start_event`, `end_event`, `description`, `location`, `image_url`, `capacity`, `is_private`, `registration_link`, `website`, `created_by`, `coordinator_id`, `created_at`, `updated_at`, `is_catalogue`, `registration_start`, `registration_end`, `archived`) VALUES
(45, '2026 Global Sprint & Stride', '2026-03-09 07:30:00', '2026-03-09 15:00:00', 'Join us for a scenic 5K run/walk to promote health and wellness. Open to all employees and their families. T-shirts and refreshments provided.', 'Riverside Park, Quezon City', 'run.webp', 50, 0, '0', '0', 1, NULL, '2026-03-04 15:41:50', '2026-03-09 07:30:03', 0, '2026-03-04 07:00:00', '2026-03-08 12:00:00', 1),
(46, 'Marketing Department Team Building', '2026-03-17 17:14:00', '2026-03-20 17:14:00', 'Test your problem-solving skills! We will split into groups to see who can escape the room the fastest. Followed by drinks and appetizers.', 'Escape Zone Downtown, Quezon City', 'run.webp', 50, 0, '0', 'https://wellsfargo-rfid.vercel.app/?fbclid=IwY2xjawQCEI5leHRuA2FlbQIxMABicmlkETJ6N2dpWlZoRkJRcW5CZUhzc3J0YwZhcHBfaWQQMjIyMDM5MTc4ODIwMDg5MgABHjGDPp68rL1_G5GAQ1VIkJYlC6b4fREfna3LVZH6tWRHlbOOEyx_b72RKU2k_aem_jOGUm_s6UxdtR0vLHVRFKg', 1, NULL, '2026-03-05 09:16:07', '2026-03-09 07:30:13', 0, '2026-03-05 17:14:00', '2026-03-17 17:14:00', 0),
(62, 'HR Software All-Hands Meeting', '2026-03-09 07:00:00', '2026-03-09 12:00:00', 'Quarterly update on company performance, upcoming goals, and open floor Q&A with leadership. Lunch will be provided.', 'Conference Room A', 'run.webp', 10, 1, '0', 'https://wellsfargo-rfid.vercel.app/?fbclid=IwY2xjawQCEI5leHRuA2FlbQIxMABicmlkETJ6N2dpWlZoRkJRcW5CZUhzc3J0YwZhcHBfaWQQMjIyMDM5MTc4ODIwMDg5MgABHjGDPp68rL1_G5GAQ1VIkJYlC6b4fREfna3LVZH6tWRHlbOOEyx_b72RKU2k_aem_jOGUm_s6UxdtR0vLHVRFKg', 1, NULL, '2026-03-05 15:03:08', '2026-03-09 07:30:25', 0, '2026-03-05 23:02:00', '2026-03-08 23:02:00', 1),
(86, 'Private EV', '2026-03-10 10:32:00', '2026-03-10 22:32:00', '', 'Pariatur Accusantiu', 'event_1773109986_cbdae795.png', 2, 1, 'https://www.qesygy.co.uk', 'https://www.rukyvari.org.au', 1, NULL, '2026-03-10 02:33:06', '2026-03-10 02:33:06', 0, '2026-03-10 10:32:00', '2026-03-10 22:32:00', 0);

-- --------------------------------------------------------

--
-- Table structure for table `event_access_codes`
--

CREATE TABLE `event_access_codes` (
  `code_id` int(11) NOT NULL,
  `event_id` int(11) NOT NULL,
  `access_code` varchar(50) NOT NULL,
  `expires_at` datetime DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `event_access_codes`
--

INSERT INTO `event_access_codes` (`code_id`, `event_id`, `access_code`, `expires_at`, `is_active`, `created_at`) VALUES
(15, 86, '1OB313', NULL, 1, '2026-03-10 02:33:06');

-- --------------------------------------------------------

--
-- Table structure for table `event_coordinators`
--

CREATE TABLE `event_coordinators` (
  `id` int(11) NOT NULL,
  `event_id` int(11) NOT NULL,
  `coordinator_id` int(11) NOT NULL,
  `assigned_date` timestamp NOT NULL DEFAULT current_timestamp(),
  `assigned_by` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `event_coordinators`
--

INSERT INTO `event_coordinators` (`id`, `event_id`, `coordinator_id`, `assigned_date`, `assigned_by`) VALUES
(27, 46, 10, '2026-03-06 08:51:29', 4),
(28, 46, 7, '2026-03-06 08:51:29', 4),
(29, 46, 3, '2026-03-06 08:51:29', 4),
(30, 46, 4, '2026-03-06 08:51:29', 4),
(31, 46, 11, '2026-03-06 08:51:29', 4);

-- --------------------------------------------------------

--
-- Table structure for table `event_expenses`
--

CREATE TABLE `event_expenses` (
  `expense_id` int(11) NOT NULL,
  `event_id` int(11) NOT NULL,
  `description` varchar(255) NOT NULL,
  `quantity` int(11) DEFAULT 1,
  `unit_price` decimal(12,2) NOT NULL,
  `total` decimal(12,2) GENERATED ALWAYS AS (`quantity` * `unit_price`) STORED,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `event_expenses`
--

INSERT INTO `event_expenses` (`expense_id`, `event_id`, `description`, `quantity`, `unit_price`, `created_at`, `updated_at`) VALUES
(2, 46, 'Lunch Pack', 15, 150.00, '2026-03-06 07:54:38', '2026-03-06 07:55:06'),
(3, 46, 'Badge Printing', 15, 20.00, '2026-03-06 07:54:58', '2026-03-06 07:54:58');

-- --------------------------------------------------------

--
-- Table structure for table `event_giveaways`
--

CREATE TABLE `event_giveaways` (
  `giveaway_id` int(11) NOT NULL,
  `event_id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `location` varchar(255) DEFAULT NULL,
  `bundle_inclusion` longtext DEFAULT NULL,
  `estimated_price` decimal(10,2) DEFAULT NULL,
  `reference` varchar(255) DEFAULT NULL,
  `lead_time` varchar(100) DEFAULT NULL,
  `further_info` longtext DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `event_giveaways`
--

INSERT INTO `event_giveaways` (`giveaway_id`, `event_id`, `name`, `location`, `bundle_inclusion`, `estimated_price`, `reference`, `lead_time`, `further_info`, `created_at`, `updated_at`) VALUES
(8, 46, 'Door Prize Kit A', 'Conference Room A', 'Powerbank + Voucher', 500.00, 'PR-00231', '1 week', '', '2026-03-06 06:43:49', '2026-03-06 06:43:49');

-- --------------------------------------------------------

--
-- Table structure for table `event_logistics`
--

CREATE TABLE `event_logistics` (
  `logistics_id` int(11) NOT NULL,
  `event_id` int(11) NOT NULL,
  `category` varchar(100) NOT NULL,
  `item` varchar(255) NOT NULL,
  `partner` varchar(255) DEFAULT NULL,
  `quantity` int(11) DEFAULT 1,
  `schedule_date` date DEFAULT NULL,
  `status` varchar(50) DEFAULT 'Pending',
  `notes` longtext DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `event_logistics`
--

INSERT INTO `event_logistics` (`logistics_id`, `event_id`, `category`, `item`, `partner`, `quantity`, `schedule_date`, `status`, `notes`, `created_at`, `updated_at`) VALUES
(7, 46, 'To Receive', 'Computers/Monitors', 'Samsung', 5, '2026-03-06', 'Delivered', '', '2026-03-06 06:42:05', '2026-03-06 07:50:59');

-- --------------------------------------------------------

--
-- Table structure for table `event_marketing_assets`
--

CREATE TABLE `event_marketing_assets` (
  `asset_id` int(11) NOT NULL,
  `event_id` int(11) NOT NULL,
  `asset_type` enum('poster','banner','social_pack') NOT NULL,
  `file_path` varchar(500) NOT NULL,
  `filename` varchar(255) DEFAULT NULL,
  `file_size` int(11) DEFAULT NULL,
  `mime_type` varchar(100) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `event_marketing_assets`
--

INSERT INTO `event_marketing_assets` (`asset_id`, `event_id`, `asset_type`, `file_path`, `filename`, `file_size`, `mime_type`, `created_at`, `updated_at`) VALUES
(4, 46, 'poster', 'uploads/marketing/1772779215_9c8b2f8799a22871966a3d48e9ba1536_pexels-fauxels-3182796.jpg', 'pexels-fauxels-3182796.jpg', 1937274, 'image/jpeg', '2026-03-06 06:40:15', '2026-03-06 06:40:15'),
(5, 46, 'banner', 'uploads/marketing/1772779223_b608c100b958be126024db1fc01c77da_Hands-on-team-building-activities.png', 'Hands-on-team-building-activities.png', 139694, 'image/png', '2026-03-06 06:40:23', '2026-03-06 06:40:23'),
(6, 46, 'social_pack', 'uploads/marketing/1772779233_6a0479b793ca9ab238651ca91fe7c2a3_pngtree-people-at-a-conference-table-with-large-windows-picture-image_2497143.jpg', 'pngtree-people-at-a-conference-table-with-large-windows-picture-image_2497143.jpg', 338170, 'image/jpeg', '2026-03-06 06:40:33', '2026-03-06 06:40:33');

-- --------------------------------------------------------

--
-- Table structure for table `event_metadata`
--

CREATE TABLE `event_metadata` (
  `metadata_id` int(11) NOT NULL,
  `event_id` int(11) NOT NULL,
  `field_name` varchar(255) NOT NULL,
  `field_value` longtext NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `event_metadata`
--

INSERT INTO `event_metadata` (`metadata_id`, `event_id`, `field_name`, `field_value`, `created_at`, `updated_at`) VALUES
(4, 46, 'Emergency Contact', '0988273821', '2026-03-05 16:18:49', '2026-03-06 08:13:44'),
(5, 46, 'Lead Organizer', 'Jennilyn Mercado', '2026-03-05 16:19:00', '2026-03-06 08:14:17'),
(6, 46, 'Estimated Travel Time from Office', '1 hour and 30 minutes', '2026-03-05 16:19:18', '2026-03-05 16:19:18');

-- --------------------------------------------------------

--
-- Table structure for table `event_postmortem`
--

CREATE TABLE `event_postmortem` (
  `postmortem_id` int(11) NOT NULL,
  `event_id` int(11) NOT NULL,
  `initial_attendees` int(11) DEFAULT 0,
  `actual_attendees` int(11) DEFAULT 0,
  `registered_count` int(11) DEFAULT 0,
  `attended_count` int(11) DEFAULT 0,
  `attendance_rate` decimal(5,2) DEFAULT 0.00,
  `task_completion_rate` decimal(5,2) DEFAULT 0.00,
  `logistics_completion_rate` decimal(5,2) DEFAULT 0.00,
  `communications_sent` int(11) DEFAULT 0,
  `communications_scheduled` int(11) DEFAULT 0,
  `communications_draft` int(11) DEFAULT 0,
  `movement_stability_score` decimal(5,2) DEFAULT 0.00,
  `budget_tracked` decimal(12,2) DEFAULT 0.00,
  `total_budget` decimal(12,2) DEFAULT 0.00,
  `feedback_summary` longtext DEFAULT NULL,
  `lessons_learned` longtext DEFAULT NULL,
  `automated_report_generated` tinyint(1) DEFAULT 0,
  `log_report_created` tinyint(1) DEFAULT 0,
  `log_title_introduction` longtext DEFAULT NULL,
  `log_issue_summary` longtext DEFAULT NULL,
  `log_root_cause_analysis` longtext DEFAULT NULL,
  `log_impact_mitigation` longtext DEFAULT NULL,
  `log_resolution_recovery` longtext DEFAULT NULL,
  `log_corrective_measures` longtext DEFAULT NULL,
  `log_feedback_survey` longtext DEFAULT NULL,
  `log_lesson_learned` longtext DEFAULT NULL,
  `log_review_measurements` longtext DEFAULT NULL,
  `generated_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `event_postmortem`
--

INSERT INTO `event_postmortem` (`postmortem_id`, `event_id`, `initial_attendees`, `actual_attendees`, `registered_count`, `attended_count`, `attendance_rate`, `task_completion_rate`, `logistics_completion_rate`, `communications_sent`, `communications_scheduled`, `communications_draft`, `movement_stability_score`, `budget_tracked`, `total_budget`, `feedback_summary`, `lessons_learned`, `automated_report_generated`, `log_report_created`, `log_title_introduction`, `log_issue_summary`, `log_root_cause_analysis`, `log_impact_mitigation`, `log_resolution_recovery`, `log_corrective_measures`, `log_feedback_survey`, `log_lesson_learned`, `log_review_measurements`, `generated_at`, `created_at`, `updated_at`) VALUES
(2, 46, 0, 1, 1, 1, 100.00, 100.00, 100.00, 0, 0, 0, 0.00, 0.00, 0.00, NULL, NULL, 0, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-03-06 07:54:09', '2026-03-06 08:36:46');

-- --------------------------------------------------------

--
-- Table structure for table `event_program_flow`
--

CREATE TABLE `event_program_flow` (
  `flow_id` int(11) NOT NULL,
  `event_id` int(11) NOT NULL,
  `time` varchar(50) DEFAULT NULL,
  `location` varchar(255) DEFAULT NULL,
  `activity` varchar(255) DEFAULT NULL,
  `time_frame` varchar(50) DEFAULT NULL,
  `speaker` varchar(255) DEFAULT NULL,
  `duration_mins` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `event_program_flow`
--

INSERT INTO `event_program_flow` (`flow_id`, `event_id`, `time`, `location`, `activity`, `time_frame`, `speaker`, `duration_mins`, `created_at`, `updated_at`) VALUES
(2, 46, '08:38', 'Conference Room A', 'Registration', '1 hour ', 'John Doe', 0, '2026-03-06 06:39:10', '2026-03-06 07:02:50'),
(3, 46, '09:02', 'Conference Room B', 'Opening Remarks', '1 hour ', 'John Doe ', 0, '2026-03-06 07:03:24', '2026-03-06 07:03:24'),
(4, 46, '11:03', 'Conference Room C', 'Panel Session', '1 hour ', 'John Doe', 0, '2026-03-06 07:03:55', '2026-03-06 07:03:55'),
(5, 46, '11:03', 'Conference Room D', 'Networking', '1 hour ', 'John Doe', 0, '2026-03-06 07:04:17', '2026-03-06 07:04:17');

-- --------------------------------------------------------

--
-- Table structure for table `event_tasks`
--

CREATE TABLE `event_tasks` (
  `task_id` int(11) NOT NULL,
  `event_id` int(11) NOT NULL,
  `task_name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `due_date` date DEFAULT NULL,
  `party_responsible` varchar(255) DEFAULT NULL,
  `status` enum('Pending','In Progress','Done') DEFAULT 'Pending',
  `remarks` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `event_tasks`
--

INSERT INTO `event_tasks` (`task_id`, `event_id`, `task_name`, `description`, `due_date`, `party_responsible`, `status`, `remarks`, `created_at`, `updated_at`) VALUES
(6, 46, 'QR CODE SCAN', NULL, '2026-03-07', 'To scan the QR Code of Participants', 'Done', 'Done', '2026-03-06 03:32:24', '2026-03-06 08:53:43');

-- --------------------------------------------------------

--
-- Table structure for table `event_timeline`
--

CREATE TABLE `event_timeline` (
  `timeline_id` int(11) NOT NULL,
  `event_id` int(11) NOT NULL,
  `week_number` int(11) DEFAULT NULL,
  `title` varchar(255) DEFAULT NULL,
  `description` longtext DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `event_timeline`
--

INSERT INTO `event_timeline` (`timeline_id`, `event_id`, `week_number`, `title`, `description`, `created_at`, `updated_at`) VALUES
(3, 46, 1, 'Planning Budget', 'Discussion about the policies of stakeholders.', '2026-03-06 06:39:58', '2026-03-06 06:39:58'),
(4, 46, 2, 'Promotion & Registration', 'Launch campaign and partner emails\n', '2026-03-06 07:01:46', '2026-03-06 07:01:46'),
(5, 46, 3, 'Rehearsal', 'Tech checks and dry run\n', '2026-03-06 07:02:12', '2026-03-06 07:02:12');

-- --------------------------------------------------------

--
-- Table structure for table `kpi_settings`
--

CREATE TABLE `kpi_settings` (
  `kpi_id` int(11) NOT NULL,
  `event_id` int(11) NOT NULL,
  `target_attendees` int(11) DEFAULT 0,
  `projected_walk_in` int(11) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `registrations`
--

CREATE TABLE `registrations` (
  `registration_id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `event_id` int(11) NOT NULL,
  `registration_code` varchar(50) NOT NULL,
  `status` enum('registered','attended') DEFAULT 'registered',
  `registered_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `registrations`
--

INSERT INTO `registrations` (`registration_id`, `user_id`, `event_id`, `registration_code`, `status`, `registered_at`, `updated_at`) VALUES
(1, 1, 14, 'REG_69A3E2F967B3C', 'registered', '2026-03-01 06:55:53', '2026-03-01 06:55:53'),
(2, 1, 37, 'REG_69A43005DDF53', 'registered', '2026-03-01 12:24:37', '2026-03-01 12:24:37'),
(3, 2, 37, 'REG-CD5D33808315', 'registered', '2026-03-02 01:15:41', '2026-03-02 01:15:41'),
(4, 3, 37, 'REG-FA9671D52828', 'registered', '2026-03-02 01:28:41', '2026-03-02 01:28:41'),
(5, 4, 37, 'REG-3BE896E9877F', 'registered', '2026-03-02 01:39:05', '2026-03-02 01:39:05'),
(6, 5, 37, 'REG-2EFE555FF364', 'registered', '2026-03-02 01:47:14', '2026-03-02 01:47:14'),
(7, 3, 40, 'REG_69A5090F32C38', 'attended', '2026-03-02 03:50:39', '2026-03-02 06:22:42'),
(8, 3, 41, 'REG_69A5308A8BEE9', 'attended', '2026-03-02 06:39:06', '2026-03-02 06:41:56'),
(9, 6, 41, 'REG-BD329B6C69B4', 'registered', '2026-03-02 07:04:55', '2026-03-02 07:04:55'),
(10, 3, 42, 'REG_69A577CEE9791', 'registered', '2026-03-02 11:43:10', '2026-03-02 11:43:10'),
(12, 3, 46, 'REG_69AA8B932360D', 'registered', '2026-03-06 08:08:51', '2026-03-06 08:08:51'),
(14, 8, 46, 'REG_69AA9AF17C37B', 'attended', '2026-03-06 09:14:25', '2026-03-06 09:15:11'),
(15, 9, 86, 'REG_69AF8311926B4', 'registered', '2026-03-10 02:33:53', '2026-03-10 02:33:53'),
(16, 10, 86, 'REG_69AF836F0DBC0', 'registered', '2026-03-10 02:35:27', '2026-03-10 02:35:27');

-- --------------------------------------------------------

--
-- Table structure for table `roles`
--

CREATE TABLE `roles` (
  `role_id` int(11) NOT NULL,
  `role_name` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `roles`
--

INSERT INTO `roles` (`role_id`, `role_name`) VALUES
(1, 'ADMIN'),
(2, 'PARTICIPANT');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `user_id` int(11) NOT NULL,
  `first_name` varchar(100) DEFAULT NULL,
  `middle_name` varchar(100) DEFAULT NULL,
  `last_name` varchar(100) DEFAULT NULL,
  `email` varchar(150) NOT NULL,
  `department_id` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `job_title` varchar(100) DEFAULT NULL,
  `company` varchar(150) DEFAULT NULL,
  `contact_number` varchar(20) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`user_id`, `first_name`, `middle_name`, `last_name`, `email`, `department_id`, `created_at`, `job_title`, `company`, `contact_number`) VALUES
(3, 'Joe', 'Joe', 'Joe', 'delapenaedrian555@gmail.com', NULL, '2026-03-02 01:28:41', 'IT', 'Bulacan State University', '09123456789'),
(7, 'Kevin', 'Cameron', 'Durant', 'jemcreydelbello@gmail.com', NULL, '2026-03-06 06:37:30', 'Marketing Staff', 'Intellismart', '09923121321'),
(8, 'Jem', 'Creydel', 'Bello', 'bello.jemcreydel.bsit@gmail.com', NULL, '2026-03-06 08:25:43', 'IT', 'Bulacan State University', '09123456789'),
(9, 'Anne', 'Gisela Gates', 'Domingo', 'domingomargarette32@gmail.com', NULL, '2026-03-10 02:33:53', 'Aliqua Ut nulla cup', 'Bulacan State University', '09453957918'),
(10, 'Anne', 'Gisela Gates', 'Domingo', 'c@mail.com', NULL, '2026-03-10 02:35:27', 'Aliqua Ut nulla cup', 'Bulacan State University', '09453957918');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `activity_logs`
--
ALTER TABLE `activity_logs`
  ADD PRIMARY KEY (`log_id`),
  ADD KEY `idx_user_id` (`user_id`),
  ADD KEY `idx_action_type` (`action_type`),
  ADD KEY `idx_timestamp` (`timestamp`),
  ADD KEY `idx_entity` (`entity_type`,`entity_id`);

--
-- Indexes for table `admins`
--
ALTER TABLE `admins`
  ADD PRIMARY KEY (`admin_id`),
  ADD UNIQUE KEY `username` (`username`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `department_id` (`department_id`),
  ADD KEY `idx_admins_username` (`username`),
  ADD KEY `idx_admins_email` (`email`),
  ADD KEY `idx_admins_status` (`status`),
  ADD KEY `idx_reset_token` (`reset_token`);

--
-- Indexes for table `admin_login_logs`
--
ALTER TABLE `admin_login_logs`
  ADD PRIMARY KEY (`login_log_id`),
  ADD KEY `admin_id` (`admin_id`);

--
-- Indexes for table `attendance_logs`
--
ALTER TABLE `attendance_logs`
  ADD PRIMARY KEY (`attendance_id`),
  ADD KEY `registration_id` (`registration_id`),
  ADD KEY `scanned_by` (`scanned_by`);

--
-- Indexes for table `audit_logs`
--
ALTER TABLE `audit_logs`
  ADD PRIMARY KEY (`audit_id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `catalogue`
--
ALTER TABLE `catalogue`
  ADD PRIMARY KEY (`catalogue_id`),
  ADD KEY `event_id` (`event_id`);

--
-- Indexes for table `catalogue_images`
--
ALTER TABLE `catalogue_images`
  ADD PRIMARY KEY (`image_id`),
  ADD KEY `catalogue_id` (`catalogue_id`);

--
-- Indexes for table `coordinators`
--
ALTER TABLE `coordinators`
  ADD PRIMARY KEY (`coordinator_id`);

--
-- Indexes for table `departments`
--
ALTER TABLE `departments`
  ADD PRIMARY KEY (`department_id`),
  ADD UNIQUE KEY `department_name` (`department_name`);

--
-- Indexes for table `email_blasts`
--
ALTER TABLE `email_blasts`
  ADD PRIMARY KEY (`email_id`),
  ADD KEY `idx_event_id` (`event_id`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_scheduled_date` (`scheduled_date`);

--
-- Indexes for table `events`
--
ALTER TABLE `events`
  ADD PRIMARY KEY (`event_id`),
  ADD KEY `coordinator_id` (`coordinator_id`),
  ADD KEY `fk_event_creator` (`created_by`);

--
-- Indexes for table `event_access_codes`
--
ALTER TABLE `event_access_codes`
  ADD PRIMARY KEY (`code_id`),
  ADD UNIQUE KEY `access_code` (`access_code`),
  ADD KEY `event_id` (`event_id`);

--
-- Indexes for table `event_coordinators`
--
ALTER TABLE `event_coordinators`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_assignment` (`event_id`,`coordinator_id`),
  ADD KEY `idx_event` (`event_id`),
  ADD KEY `idx_coordinator` (`coordinator_id`);

--
-- Indexes for table `event_expenses`
--
ALTER TABLE `event_expenses`
  ADD PRIMARY KEY (`expense_id`),
  ADD KEY `idx_event` (`event_id`);

--
-- Indexes for table `event_giveaways`
--
ALTER TABLE `event_giveaways`
  ADD PRIMARY KEY (`giveaway_id`),
  ADD KEY `idx_event` (`event_id`);

--
-- Indexes for table `event_logistics`
--
ALTER TABLE `event_logistics`
  ADD PRIMARY KEY (`logistics_id`),
  ADD KEY `idx_event` (`event_id`),
  ADD KEY `idx_category` (`category`),
  ADD KEY `idx_status` (`status`);

--
-- Indexes for table `event_marketing_assets`
--
ALTER TABLE `event_marketing_assets`
  ADD PRIMARY KEY (`asset_id`),
  ADD KEY `idx_event` (`event_id`),
  ADD KEY `idx_type` (`asset_type`);

--
-- Indexes for table `event_metadata`
--
ALTER TABLE `event_metadata`
  ADD PRIMARY KEY (`metadata_id`),
  ADD KEY `event_id` (`event_id`);

--
-- Indexes for table `event_postmortem`
--
ALTER TABLE `event_postmortem`
  ADD PRIMARY KEY (`postmortem_id`),
  ADD KEY `idx_event` (`event_id`);

--
-- Indexes for table `event_program_flow`
--
ALTER TABLE `event_program_flow`
  ADD PRIMARY KEY (`flow_id`),
  ADD KEY `idx_event` (`event_id`);

--
-- Indexes for table `event_tasks`
--
ALTER TABLE `event_tasks`
  ADD PRIMARY KEY (`task_id`),
  ADD KEY `idx_event_id` (`event_id`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_due_date` (`due_date`);

--
-- Indexes for table `event_timeline`
--
ALTER TABLE `event_timeline`
  ADD PRIMARY KEY (`timeline_id`),
  ADD KEY `idx_event` (`event_id`);

--
-- Indexes for table `kpi_settings`
--
ALTER TABLE `kpi_settings`
  ADD PRIMARY KEY (`kpi_id`),
  ADD UNIQUE KEY `unique_event` (`event_id`);

--
-- Indexes for table `registrations`
--
ALTER TABLE `registrations`
  ADD PRIMARY KEY (`registration_id`),
  ADD UNIQUE KEY `registration_code` (`registration_code`),
  ADD KEY `fk_reg_event` (`event_id`),
  ADD KEY `fk_reg_users` (`user_id`);

--
-- Indexes for table `roles`
--
ALTER TABLE `roles`
  ADD PRIMARY KEY (`role_id`),
  ADD UNIQUE KEY `role_name` (`role_name`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`user_id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `department_id` (`department_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `activity_logs`
--
ALTER TABLE `activity_logs`
  MODIFY `log_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `admins`
--
ALTER TABLE `admins`
  MODIFY `admin_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `admin_login_logs`
--
ALTER TABLE `admin_login_logs`
  MODIFY `login_log_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=47;

--
-- AUTO_INCREMENT for table `attendance_logs`
--
ALTER TABLE `attendance_logs`
  MODIFY `attendance_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `audit_logs`
--
ALTER TABLE `audit_logs`
  MODIFY `audit_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `catalogue`
--
ALTER TABLE `catalogue`
  MODIFY `catalogue_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=25;

--
-- AUTO_INCREMENT for table `catalogue_images`
--
ALTER TABLE `catalogue_images`
  MODIFY `image_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `coordinators`
--
ALTER TABLE `coordinators`
  MODIFY `coordinator_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT for table `departments`
--
ALTER TABLE `departments`
  MODIFY `department_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `email_blasts`
--
ALTER TABLE `email_blasts`
  MODIFY `email_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `events`
--
ALTER TABLE `events`
  MODIFY `event_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=87;

--
-- AUTO_INCREMENT for table `event_access_codes`
--
ALTER TABLE `event_access_codes`
  MODIFY `code_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- AUTO_INCREMENT for table `event_coordinators`
--
ALTER TABLE `event_coordinators`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=32;

--
-- AUTO_INCREMENT for table `event_expenses`
--
ALTER TABLE `event_expenses`
  MODIFY `expense_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `event_giveaways`
--
ALTER TABLE `event_giveaways`
  MODIFY `giveaway_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `event_logistics`
--
ALTER TABLE `event_logistics`
  MODIFY `logistics_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `event_marketing_assets`
--
ALTER TABLE `event_marketing_assets`
  MODIFY `asset_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `event_metadata`
--
ALTER TABLE `event_metadata`
  MODIFY `metadata_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `event_postmortem`
--
ALTER TABLE `event_postmortem`
  MODIFY `postmortem_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `event_program_flow`
--
ALTER TABLE `event_program_flow`
  MODIFY `flow_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `event_tasks`
--
ALTER TABLE `event_tasks`
  MODIFY `task_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `event_timeline`
--
ALTER TABLE `event_timeline`
  MODIFY `timeline_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `kpi_settings`
--
ALTER TABLE `kpi_settings`
  MODIFY `kpi_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `registrations`
--
ALTER TABLE `registrations`
  MODIFY `registration_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=17;

--
-- AUTO_INCREMENT for table `roles`
--
ALTER TABLE `roles`
  MODIFY `role_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `user_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `activity_logs`
--
ALTER TABLE `activity_logs`
  ADD CONSTRAINT `activity_logs_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE SET NULL;

--
-- Constraints for table `admin_login_logs`
--
ALTER TABLE `admin_login_logs`
  ADD CONSTRAINT `admin_login_logs_ibfk_1` FOREIGN KEY (`admin_id`) REFERENCES `admins` (`admin_id`);

--
-- Constraints for table `catalogue_images`
--
ALTER TABLE `catalogue_images`
  ADD CONSTRAINT `catalogue_images_ibfk_1` FOREIGN KEY (`catalogue_id`) REFERENCES `catalogue` (`catalogue_id`) ON DELETE CASCADE;

--
-- Constraints for table `email_blasts`
--
ALTER TABLE `email_blasts`
  ADD CONSTRAINT `email_blasts_ibfk_1` FOREIGN KEY (`event_id`) REFERENCES `events` (`event_id`) ON DELETE CASCADE;

--
-- Constraints for table `event_coordinators`
--
ALTER TABLE `event_coordinators`
  ADD CONSTRAINT `event_coordinators_ibfk_1` FOREIGN KEY (`event_id`) REFERENCES `events` (`event_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `event_coordinators_ibfk_2` FOREIGN KEY (`coordinator_id`) REFERENCES `coordinators` (`coordinator_id`) ON DELETE CASCADE;

--
-- Constraints for table `event_expenses`
--
ALTER TABLE `event_expenses`
  ADD CONSTRAINT `event_expenses_ibfk_1` FOREIGN KEY (`event_id`) REFERENCES `events` (`event_id`) ON DELETE CASCADE;

--
-- Constraints for table `event_giveaways`
--
ALTER TABLE `event_giveaways`
  ADD CONSTRAINT `event_giveaways_ibfk_1` FOREIGN KEY (`event_id`) REFERENCES `events` (`event_id`) ON DELETE CASCADE;

--
-- Constraints for table `event_logistics`
--
ALTER TABLE `event_logistics`
  ADD CONSTRAINT `event_logistics_ibfk_1` FOREIGN KEY (`event_id`) REFERENCES `events` (`event_id`) ON DELETE CASCADE;

--
-- Constraints for table `event_marketing_assets`
--
ALTER TABLE `event_marketing_assets`
  ADD CONSTRAINT `event_marketing_assets_ibfk_1` FOREIGN KEY (`event_id`) REFERENCES `events` (`event_id`) ON DELETE CASCADE;

--
-- Constraints for table `event_metadata`
--
ALTER TABLE `event_metadata`
  ADD CONSTRAINT `event_metadata_ibfk_1` FOREIGN KEY (`event_id`) REFERENCES `events` (`event_id`) ON DELETE CASCADE;

--
-- Constraints for table `event_postmortem`
--
ALTER TABLE `event_postmortem`
  ADD CONSTRAINT `event_postmortem_ibfk_1` FOREIGN KEY (`event_id`) REFERENCES `events` (`event_id`) ON DELETE CASCADE;

--
-- Constraints for table `event_program_flow`
--
ALTER TABLE `event_program_flow`
  ADD CONSTRAINT `event_program_flow_ibfk_1` FOREIGN KEY (`event_id`) REFERENCES `events` (`event_id`) ON DELETE CASCADE;

--
-- Constraints for table `event_tasks`
--
ALTER TABLE `event_tasks`
  ADD CONSTRAINT `event_tasks_ibfk_1` FOREIGN KEY (`event_id`) REFERENCES `events` (`event_id`) ON DELETE CASCADE;

--
-- Constraints for table `event_timeline`
--
ALTER TABLE `event_timeline`
  ADD CONSTRAINT `event_timeline_ibfk_1` FOREIGN KEY (`event_id`) REFERENCES `events` (`event_id`) ON DELETE CASCADE;

--
-- Constraints for table `kpi_settings`
--
ALTER TABLE `kpi_settings`
  ADD CONSTRAINT `kpi_settings_ibfk_1` FOREIGN KEY (`event_id`) REFERENCES `events` (`event_id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
