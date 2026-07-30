[CmdletBinding(SupportsShouldProcess, ConfirmImpact = 'High')]
param(
    [Parameter(Mandatory)]
    [string] $SubscriptionId,

    [Parameter(Mandatory)]
    [string] $ResourceGroup
)

$ErrorActionPreference = 'Stop'
az account set --subscription $SubscriptionId

if ($PSCmdlet.ShouldProcess($ResourceGroup, 'Delete the Azure resource group and all contained resources')) {
    az group delete --name $ResourceGroup --yes
}
